/* ================= DREAM SANDWICH — COSTING & P&L ENGINE ================= */
const CHANNELS = [
  { id: 'bakery', label: 'Bakery', sub: 'Production + counter', color: '#d97706', cls: 'bakery' },
  { id: 'store', label: 'Store / Stall', sub: 'Counter sales', color: '#0d9488', cls: 'store' },
  { id: 'supply', label: 'Marketing Supply', sub: 'Outlets & distributors', color: '#4f46e5', cls: 'supply' }
];
const VLABEL = { bakery: 'Bakery', store: 'Store / Stall', supply: 'Marketing Supply', common: 'Common' };

const ingById = id => DB.ingredients.find(i => i.id === id);
const productById = id => DB.products.find(p => p.id === id);
const partyById = id => DB.parties.find(p => p.id === id);
const outlets = () => DB.parties.filter(p => p.type === 'outlet');
const vendors = () => DB.parties.filter(p => p.type === 'vendor');
const customers = () => DB.parties.filter(p => p.type === 'customer');
const buyers = () => DB.parties.filter(p => p.type !== 'vendor');
const agents = () => (DB.agents || []);

/* ---- wastage / stock adjust cost ---- */
function wastageCost(w) {
  if (w.itemType === 'ingredient') { const ing = ingById(w.itemId); return r2(num(w.qty) * num(ing && ing.rate)); }
  const p = productById(w.itemId);
  return r2(num(w.qty) * productCost(p).perPc);
}
function agentBalance(agentId) {
  const collected = DB.sales.filter(s => s.agentId === agentId && s.payMode === 'cash').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const deposited = (DB.agentDeposits || []).filter(d => d.agentId === agentId).reduce((a, d) => a + num(d.amount), 0);
  return r2(collected - deposited);
}

/* ---- ek recipe line ki quantity (formula support: "0.25", "12%", "base*0.02") ---- */
function lineQty(line, r) {
  const base = num(r && r.batchBase);
  const yq = num(r && r.yieldQty);
  const raw = line && line.qty !== undefined ? line.qty : 0;
  const v = num(raw, { base: base, yq: yq });
  return isFinite(v) ? v : 0;
}

/* ---- PRODUCT COST (master formula) ----
   Cost/pc = (Σ ingredient cost ÷ yield ÷ (1 - wastage%)) + (labour + overhead) ÷ yield + packaging/pc  */
function productCost(p) {
  const empty = { perPc: 0, perBatch: 0, lines: [], ingr: 0, labour: 0, overhead: 0, packaging: 0, yieldQty: 1, wastage: 0, packPerPc: 0 };
  if (!p) return empty;
  if (p.combo && p.combo.length) {
    const perPc = p.combo.reduce((a, c) => a + productCost(productById(c.productId)).perPc * num(c.qty), 0);
    return { perPc: perPc, perBatch: perPc, lines: [], ingr: perPc, labour: 0, overhead: 0, packaging: 0, yieldQty: 1, wastage: 0, packPerPc: 0, comboMode: true };
  }
  if (p.costMode === 'purchase') {
    const c = num(p.purchaseCost);
    return { perPc: c, perBatch: c, lines: [], ingr: c, labour: 0, overhead: 0, packaging: 0, yieldQty: 1, wastage: 0, packPerPc: 0, directMode: true };
  }
  const r = p.recipe || { lines: [] };
  const yq = Math.max(0.0001, num(r.yieldQty) || 1);
  const lines = (r.lines || []).map(l => {
    const ing = ingById(l.ingId) || { name: '(hataya gaya item)', unit: '', rate: 0 };
    const q = lineQty(l, r);
    const rate = num(ing.rate);
    return { ingId: l.ingId, name: ing.name, unit: ing.unit, qty: q, rate: rate, amt: q * rate };
  });
  const ingr = lines.reduce((s, l) => s + l.amt, 0);
  const labour = num(r.labourPerBatch);
  const overhead = num(r.overheadPerBatch);
  const packPerPc = num(r.packagingPerPc);
  const w = clamp(num(r.wastagePct), 0, 90);
  const perPc = ingr / (yq * (1 - w / 100)) + (labour + overhead) / yq + packPerPc;
  return {
    perPc: perPc, perBatch: ingr + labour + overhead + packPerPc * yq, lines: lines,
    ingr: ingr, labour: labour, overhead: overhead, packaging: packPerPc * yq,
    yieldQty: yq, wastage: w, packPerPc: packPerPc
  };
}

/* ---- selling price (auto = cost + markup, formula driven) ---- */
function priceOf(p) {
  if (!p) return 0;
  if (!Number(p.autoPrice)) return r2(num(p.price));
  const step = num(p.priceRound) || 1;
  const raw = productCost(p).perPc * (1 + num(p.markupPct) / 100);
  return Math.max(step, Math.ceil(raw / step) * step);
}
function suggestedPrice(p) {
  const step = num(p.priceRound) || 1;
  return Math.max(step, Math.ceil(productCost(p).perPc * (1 + num(p.markupPct) / 100) / step) * step);
}
const supplyRateOf = p => (num(p.bulkPrice) || Math.round(priceOf(p) * 0.92));
const rateFor = (p, channel) => channel === 'supply' ? supplyRateOf(p) : priceOf(p);

/* ---- STOCK (ledger based: opening + purchase − production use) ---- */
function ingredientStock() {
  const m = {};
  DB.ingredients.forEach(i => m[i.id] = num(i.opening));
  DB.purchases.forEach(pu => (pu.lines || []).forEach(l => {
    if (m[l.ingId] !== undefined) m[l.ingId] += num(l.qty);
  }));
  DB.production.forEach(pr => {
    const p = productById(pr.productId);
    if (!p || p.costMode === 'purchase') return;
    const b = num(pr.batches) || (num(pr.qty) / Math.max(0.0001, num(p.recipe && p.recipe.yieldQty) || 1));
    (p.recipe && p.recipe.lines || []).forEach(l => {
      if (m[l.ingId] !== undefined) m[l.ingId] -= lineQty(l, p.recipe) * b;
    });
  });
  (DB.stockAdj || []).forEach(a => {
    if (m[a.ingId] === undefined) return;
    m[a.ingId] += (a.type === 'less' ? -1 : 1) * num(a.qty);
  });
  (DB.wastage || []).forEach(w => {
    if (w.itemType === 'ingredient' && m[w.itemId] !== undefined) m[w.itemId] -= num(w.qty);
  });
  Object.keys(m).forEach(k => m[k] = r3(m[k]));
  return m;
}
function stockRows() {
  const st = ingredientStock();
  return DB.ingredients.map(i => {
    const q = st[i.id] || 0;
    const min = num(i.minStock);
    return {
      ing: i, stock: q, value: r2(q * num(i.rate)), min: min,
      status: q <= 0 ? 'out' : (q < min ? 'low' : 'ok')
    };
  });
}
function lowStockRows() { return stockRows().filter(r => r.status !== 'ok'); }

function finishedStock() {
  const m = {};
  DB.products.forEach(p => m[p.id] = 0);
  DB.production.forEach(pr => { if (m[pr.productId] !== undefined) m[pr.productId] += num(pr.qty); });
  DB.sales.forEach(s => {
    const pp = productById(s.productId);
    if (pp && pp.combo && pp.combo.length) {
      pp.combo.forEach(c => { if (m[c.productId] !== undefined) m[c.productId] -= num(c.qty) * num(s.qty); });
    } else if (m[s.productId] !== undefined) m[s.productId] -= num(s.qty);
  });
  (DB.wastage || []).forEach(w => { if (w.itemType === 'product' && m[w.itemId] !== undefined) m[w.itemId] -= num(w.qty); });
  return m;
}

/* ---- period state ---- */
const P = { mode: 'month', from: startOfMonth(TODAY), to: TODAY };
function applyPeriod(mode) {
  P.mode = mode;
  const t = TODAY;
  if (mode === 'today') { P.from = t; P.to = t; }
  else if (mode === 'week') { P.from = addDays(t, -6); P.to = t; }
  else if (mode === 'month') { P.from = startOfMonth(t); P.to = t; }
  else if (mode === 'lastmonth') { const s = addDays(startOfMonth(t), -1); P.from = startOfMonth(s); P.to = s; }
  else if (mode === 'quarter') { P.from = addDays(t, -89); P.to = t; }
  else if (mode === 'fy') { P.from = fyStart(t); P.to = t; }
  else if (mode === 'all') {
    const all = DB.sales.concat(DB.purchases, DB.expenses, DB.production, DB.payments).map(x => x.date).filter(Boolean).sort();
    P.from = all[0] || startOfMonth(t); P.to = all[all.length - 1] || t;
  }
  syncPeriodInputs();
}
function syncPeriodInputs() {
  const s = $('#periodSel'), f = $('#fromDate'), t = $('#toDate');
  if (s) s.value = P.mode;
  if (f) f.value = P.from;
  if (t) t.value = P.to;
}
const inP = d => d >= P.from && d <= P.to;
const periodLabel = () => dmy(P.from) + '  –  ' + dmy(P.to);
const salesIn = (from, to, ch) => DB.sales.filter(s => s.date >= from && s.date <= to && (!ch || s.channel === ch));

/* ---- VERTICAL WISE P&L ---- */
function plFor(from, to) {
  const res = {};
  CHANNELS.forEach(c => res[c.id] = {
    id: c.id, label: c.label, sales: 0, taxable: 0, gst: 0, cogs: 0, gross: 0,
    expenses: 0, expCats: {}, profit: 0, qty: 0, bills: 0, discountGiven: 0, wastage: 0
  });
  const common = { label: 'Common', expenses: 0, expCats: {} };

  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    const c = res[s.channel]; if (!c) return;
    const amt = num(s.qty) * num(s.rate);
    const g = num(s.gstPct);
    const taxable = amt / (1 + g / 100);
    c.sales += amt;
    c.taxable += taxable;
    c.gst += amt - taxable;
    c.qty += num(s.qty);
    c.bills += 1;
    c.discountGiven += (num(s.discPct) / 100) * amt / (1 - num(s.discPct) / 100 || 1);
    const p = productById(s.productId);
    c.cogs += productCost(p).perPc * num(s.qty);
  });
  CHANNELS.forEach(c => {
    const r = res[c.id];
    r.gross = r.taxable - r.cogs;
    r.grossMarginPct = r.taxable ? r.gross / r.taxable * 100 : 0;
  });
  DB.wastage.forEach(w => {
    if (w.date < from || w.date > to) return;
    const tgt = res[w.vertical] || res.bakery;
    tgt.wastage += wastageCost(w);
  });
  (DB.writeOffs || []).forEach(w => {
    if (w.date < from || w.date > to) return;
    common.expenses += num(w.amount);
    common.expCats['Bad Debt'] = (common.expCats['Bad Debt'] || 0) + num(w.amount);
  });
  DB.expenses.forEach(e => {
    if (e.date < from || e.date > to) return;
    const tgt = (e.vertical === 'common') ? common : res[e.vertical];
    if (!tgt) return;
    tgt.expenses += num(e.amount);
    tgt.expCats[e.category] = (tgt.expCats[e.category] || 0) + num(e.amount);
  });
  CHANNELS.forEach(c => {
    const r = res[c.id];
    r.profit = r.gross - r.wastage - r.expenses;
    r.netMarginPct = r.taxable ? r.profit / r.taxable * 100 : 0;
  });
  const revenue = CHANNELS.reduce((s, c) => s + res[c.id].taxable, 0);
  const cogs = CHANNELS.reduce((s, c) => s + res[c.id].cogs, 0);
  const gross = revenue - cogs;
  const totalExp = CHANNELS.reduce((s, c) => s + res[c.id].expenses + res[c.id].wastage, 0) + common.expenses;
  const totalWastage = CHANNELS.reduce((s, c) => s + res[c.id].wastage, 0);
  const net = gross - totalExp;
  /* common expenses revenue share me allocate (sirf display ke liye) */
  CHANNELS.forEach(c => {
    const r = res[c.id];
    r.commonShare = revenue ? common.expenses * (r.taxable / revenue) : 0;
    r.profitAfterCommon = r.profit - r.commonShare;
  });
  return {
    channels: res, common: common,
    total: {
      sales: CHANNELS.reduce((s, c) => s + res[c.id].sales, 0),
      taxable: revenue, gst: CHANNELS.reduce((s, c) => s + res[c.id].gst, 0),
      cogs: cogs, gross: gross, expenses: totalExp, wastage: totalWastage, net: net,
      netMarginPct: revenue ? net / revenue * 100 : 0,
      qty: CHANNELS.reduce((s, c) => s + res[c.id].qty, 0),
      bills: CHANNELS.reduce((s, c) => s + res[c.id].bills, 0)
    }
  };
}

/* ---- PRODUCT WISE P&L ---- */
function productPL(from, to) {
  const map = {};
  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    const p = productById(s.productId);
    const m = map[s.productId] || (map[s.productId] = {
      productId: s.productId, name: p ? p.name : '(deleted)', category: p ? (p.category || '-') : '-',
      qty: 0, sales: 0, taxable: 0, cogs: 0, profit: 0, bakery: 0, store: 0, supply: 0
    });
    const amt = num(s.qty) * num(s.rate);
    const g = num(s.gstPct);
    m.qty += num(s.qty);
    m.sales += amt;
    m.taxable += amt / (1 + g / 100);
    m.cogs += productCost(p).perPc * num(s.qty);
    if (m[s.channel] !== undefined) m[s.channel] += num(s.qty) * num(s.rate);
  });
  const rows = Object.values(map);
  rows.forEach(r => {
    r.profit = r.taxable - r.cogs;
    r.marginPct = r.taxable ? r.profit / r.taxable * 100 : 0;
    r.unitCost = r.qty ? r.cogs / r.qty : 0;
    r.unitPrice = r.qty ? r.taxable / r.qty : 0;
  });
  rows.sort((a, b) => b.profit - a.profit);
  return rows;
}

/* ---- PARTY / UDHAAR LEDGER ---- */
function partyBalance(partyId) {
  const p = partyById(partyId);
  if (!p) return { receivable: 0, payable: 0 };
  if (p.type === 'outlet' || p.type === 'customer') {
    const credit = DB.sales.filter(s => s.partyId === partyId && s.payMode === 'credit')
      .reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
    const paid = DB.payments.filter(x => x.partyId === partyId).reduce((a, x) => a + num(x.amount), 0);
    const wo = (DB.writeOffs || []).filter(x => x.partyId === partyId).reduce((a, x) => a + num(x.amount), 0);
    return { receivable: r2(num(p.opening) + credit - paid - wo), payable: 0 };
  }
  const pur = DB.purchases.filter(x => x.partyId === partyId).reduce((a, x) => a + num(x.amount), 0);
  const paid = DB.purchases.filter(x => x.partyId === partyId).reduce((a, x) => a + num(x.paidAmount), 0);
  const vpay = (DB.vendorPayments || []).filter(x => x.partyId === partyId).reduce((a, x) => a + num(x.amount), 0);
  return { receivable: 0, payable: r2(num(p.opening) + pur - paid - vpay) };
}
function partyLedgerRows(partyId) {
  const p = partyById(partyId);
  const rows = [];
  if (!p) return rows;
  if (p.type === 'outlet' || p.type === 'customer') {
    DB.sales.forEach(s => {
      if (s.partyId !== partyId || s.payMode !== 'credit') return;
      rows.push({ date: s.date, type: 'Bill', ref: s.invNo || '-', narration: (productById(s.productId) || {}).name + ' × ' + QTY(s.qty), debit: r2(num(s.qty) * num(s.rate)), credit: 0 });
    });
    DB.payments.forEach(x => {
      if (x.partyId !== partyId) return;
      rows.push({ date: x.date, type: 'Receipt', ref: x.mode.toUpperCase(), narration: x.note || 'Payment received', debit: 0, credit: num(x.amount) });
    });
  } else {
    DB.purchases.forEach(x => {
      if (x.partyId !== partyId) return;
      rows.push({ date: x.date, type: 'Purchase', ref: (x.lines || []).length + ' item', narration: (x.lines || []).map(l => (ingById(l.ingId) || {}).name).join(', '), debit: 0, credit: num(x.amount) });
      if (num(x.paidAmount) > 0) rows.push({ date: x.date, type: 'Payment', ref: x.payMode.toUpperCase(), narration: 'Vendor ko payment', debit: num(x.paidAmount), credit: 0 });
    });
  }
  rows.sort((a, b) => a.date < b.date ? -1 : 1);
  let bal = num(p.opening);
  rows.forEach(r => { bal += r.debit - r.credit; r.balance = r2(bal); });
  return rows;
}
function outstandingList() {
  return buyers().map(p => {
    const b = partyBalance(p.id).receivable;
    const lastPay = DB.payments.filter(x => x.partyId === p.id).map(x => x.date).sort().pop();
    const lastSale = DB.sales.filter(s => s.partyId === p.id).map(s => s.date).sort().pop();
    return { party: p, balance: b, lastPay: lastPay || '', lastSale: lastSale || '', overLimit: num(p.creditLimit) > 0 && b > num(p.creditLimit) };
  }).filter(r => r.balance > 0.5).sort((a, b) => b.balance - a.balance);
}

/* ---- GST SUMMARY ---- */
function gstSummary(from, to) {
  const buckets = {};
  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    const g = num(s.gstPct);
    const amt = num(s.qty) * num(s.rate);
    const taxable = amt / (1 + g / 100);
    const b = buckets[g] || (buckets[g] = { rate: g, taxable: 0, tax: 0, gross: 0 });
    b.taxable += taxable; b.tax += amt - taxable; b.gross += amt;
  });
  const input = DB.purchases.filter(x => x.date >= from && x.date <= to).reduce((a, x) => a + num(x.gstAmount), 0);
  const rows = Object.values(buckets).sort((a, b) => a.rate - b.rate);
  const output = rows.reduce((a, r) => a + r.tax, 0);
  return { rows, output, input, net: output - input };
}

/* ---- CASH POSITION ---- */
function cashPosition(from, to) {
  let cashIn = 0, upiIn = 0, cashOut = 0;
  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    const amt = num(s.qty) * num(s.rate);
    if (s.payMode === 'cash') cashIn += amt;
    else if (s.payMode === 'upi') upiIn += amt;
  });
  DB.payments.forEach(x => { if (x.date >= from && x.date <= to) { if (x.mode === 'cash') cashIn += num(x.amount); else upiIn += num(x.amount); } });
  DB.expenses.forEach(e => { if (e.date >= from && e.date <= to) cashOut += num(e.amount); });
  (DB.vendorPayments || []).forEach(x => { if (x.date >= from && x.date <= to) cashOut += num(x.amount); });
  DB.purchases.forEach(pu => { if (pu.date >= from && pu.date <= to) { cashOut += num(pu.paidAmount); if (pu.paidAmount) upiIn += 0; } });
  return { cashIn, upiIn, cashOut, net: cashIn + upiIn - cashOut };
}

/* ---- DAY BOOK ---- */
function dayBook(from, to) {
  const rows = [];
  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    const p = productById(s.productId);
    const party = s.partyId ? partyById(s.partyId) : null;
    rows.push({
      date: s.date, voucher: 'Sale', vcls: 'b-' + (s.channel === 'bakery' ? 'amber' : s.channel === 'store' ? 'teal' : 'indigo'),
      channel: s.channel,
      particulars: (p ? p.name : '-') + ' × ' + QTY(s.qty),
      account: s.payMode === 'credit' ? (party ? party.name : 'Udhaar') : (s.payMode === 'upi' ? 'UPI / Bank' : 'Cash'),
      amount: r2(num(s.qty) * num(s.rate)), dir: 'Cr', ref: s.invNo || ''
    });
  });
  DB.purchases.forEach(x => {
    if (x.date < from || x.date > to) return;
    const party = partyById(x.partyId);
    rows.push({
      date: x.date, voucher: 'Purchase', vcls: 'b-grey', channel: 'store',
      particulars: (x.lines || []).map(l => (ingById(l.ingId) || {}).name + ' ' + QTY(l.qty)).join(', ').slice(0, 70),
      account: party ? party.name : 'Vendor', amount: num(x.amount), dir: 'Dr', ref: 'PB'
    });
  });
  DB.expenses.forEach(e => {
    if (e.date < from || e.date > to) return;
    rows.push({
      date: e.date, voucher: 'Expense', vcls: 'b-red', channel: e.vertical,
      particulars: e.category + (e.note ? ' — ' + e.note : ''), account: 'Cash / Bank',
      amount: num(e.amount), dir: 'Dr', ref: ''
    });
  });
  DB.payments.forEach(x => {
    if (x.date < from || x.date > to) return;
    const party = partyById(x.partyId);
    rows.push({
      date: x.date, voucher: 'Receipt', vcls: 'b-green', channel: 'supply',
      particulars: (party ? party.name : '-') + ' se payment', account: x.mode === 'upi' ? 'UPI / Bank' : 'Cash',
      amount: num(x.amount), dir: 'Cr', ref: ''
    });
  });
  DB.production.forEach(pr => {
    if (pr.date < from || pr.date > to) return;
    const p = productById(pr.productId);
    rows.push({
      date: pr.date, voucher: 'Production', vcls: 'b-navy', channel: 'bakery',
      particulars: (p ? p.name : '-') + ' — ' + QTY(pr.qty) + ' pcs (' + QTY(pr.batches) + ' batch)',
      account: 'Finished Goods', amount: r2(productCost(p).perPc * num(pr.qty)), dir: 'Dr', ref: 'MFG'
    });
  });
  return rows.sort((a, b) => a.date < b.date ? 1 : (a.date > b.date ? -1 : 0));
}

/* ---- daily sales series ---- */
function dailySeries(from, to, ch) {
  const out = [];
  const byDate = {};
  DB.sales.forEach(s => {
    if (s.date < from || s.date > to) return;
    if (ch && s.channel !== ch) return;
    byDate[s.date] = (byDate[s.date] || 0) + num(s.qty) * num(s.rate);
  });
  for (let d = from; d <= to; d = addDays(d, 1)) {
    out.push({ date: d, label: dmyShort(d), short: dmyShort(d), value: byDate[d] || 0, day: weekday(d) });
  }
  return out;
}

/* ---- save / load ---- */
function saveDB() {
  try { LS.setItem(STORE_KEY, JSON.stringify(DB)); }
  catch (e) { toast('Data save nahi hua (storage full?)', 'err'); }
}
function loadDB() {
  try {
    const raw = LS.getItem(STORE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !d.products || !d.ingredients) return null;
    return d;
  } catch (e) { return null; }
}
function resetDB() {
  LS.removeItem(STORE_KEY);
  DB = emptyDB();
  saveDB();
  current = 'setup';
  toast('Sab data mita diya — ab blank business se shuru karein', 'ok');
  render();
}
function loadDemo() {
  DB = demoDB();
  saveDB();
  current = 'dashboard';
  applyPeriod('month');
  toast('Demo data load ho gaya — dekh kar samajh lein, phir reset karke apna data daalein', 'ok');
  render();
}
