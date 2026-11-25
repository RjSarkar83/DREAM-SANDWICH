/* ================= DAILY REGISTER, REQUIREMENTS & MONTHLY EXPENSES ================= */
let DAY = TODAY;
let EXP_MONTH = monthKey(TODAY);
const addN = (obj, k, v) => { obj[k] = (obj[k] || 0) + v; };

/* ---- pending order qty per product ---- */
function pendingByProduct() {
  const supMap = {};
  DB.sales.forEach(s => { if (s.orderId) supMap[s.orderId + '|' + s.productId] = (supMap[s.orderId + '|' + s.productId] || 0) + num(s.qty); });
  const m = {};
  (DB.orders || []).forEach(o => {
    if (o.status === 'cancelled') return;
    (o.lines || []).forEach(l => {
      const sup = supMap[o.id + '|' + l.productId] || 0;
      const pend = Math.max(0, num(l.qty) - sup);
      if (pend > 0.0001) addN(m, l.productId, pend);
    });
  });
  return m;
}

/* ---- product qty -> ingredient requirement (BOM explosion) ---- */
function ingredientRequirement(prodQty) {
  const req = {};
  Object.keys(prodQty).forEach(pid => {
    const p = productById(pid);
    if (!p || p.costMode === 'purchase') return;
    const yq = Math.max(0.0001, productCost(p).yieldQty);
    const batches = num(prodQty[pid]) / yq;
    (p.recipe && p.recipe.lines || []).forEach(l => addN(req, l.ingId, lineQty(l, p.recipe) * batches));
  });
  return req;
}

/* ---- dual bar chart (order vs supply) ---- */
function dualBars(points) {
  const w = 760, h = 170, pad = { t: 10, r: 6, b: 22, l: 6 };
  if (!points.length) return '<div class="empty" style="padding:20px">Data nahi</div>';
  const max = Math.max.apply(null, points.map(p => Math.max(p.a, p.b)).concat([1]));
  const iw = (w - pad.l - pad.r) / points.length;
  const bw = Math.max(3, Math.min(11, iw * 0.34));
  let g = '', labels = '';
  points.forEach((p, i) => {
    const x0 = pad.l + i * iw + (iw - bw * 2 - 2) / 2;
    const ha = Math.max(1.5, (h - pad.t - pad.b) * (p.a / max));
    const hb = Math.max(1.5, (h - pad.t - pad.b) * (p.b / max));
    g += '<rect x="' + x0.toFixed(1) + '" y="' + (h - pad.b - ha).toFixed(1) + '" width="' + bw + '" height="' + ha.toFixed(1) + '" rx="2" fill="#c9ccd3"><title>' + esc(p.label) + ' order: ' + INR0(p.a) + '</title></rect>';
    g += '<rect x="' + (x0 + bw + 2).toFixed(1) + '" y="' + (h - pad.b - hb).toFixed(1) + '" width="' + bw + '" height="' + hb.toFixed(1) + '" rx="2" fill="#111827"><title>' + esc(p.label) + ' supply: ' + INR0(p.b) + '</title></rect>';
    if (points.length <= 32 || i % Math.ceil(points.length / 14) === 0) {
      labels += '<text x="' + (x0 + bw).toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="#9ca3af" text-anchor="middle">' + esc(p.short || p.label) + '</text>';
    }
  });
  return '<div class="chartbox"><div class="legend" style="margin-bottom:4px"><span><i style="background:#c9ccd3"></i>Order aaya</span><span><i style="background:#111827"></i>Supply kiya</span></div>' +
    '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:' + h + 'px">' +
    '<line x1="0" y1="' + (h - pad.b) + '" x2="' + w + '" y2="' + (h - pad.b) + '" stroke="#e5e7eb"/>' + g + labels + '</svg></div>';
}

/* ================= VIEW: DAILY REGISTER ================= */
function viewDaily() {
  const d = DAY;
  const sales = DB.sales.filter(s => s.date === d);
  const prods = DB.production.filter(p => p.date === d);
  const orders = (DB.orders || []).filter(o => o.date === d);
  const waste = (DB.wastage || []).filter(w => w.date === d);
  const exps = DB.expenses.filter(e => e.date === d);
  const pays = (DB.agentDeposits || []).filter(x => x.date === d);

  const saleAmt = sales.reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const supSales = sales.filter(s => s.channel === 'supply');
  const supAmt = supSales.reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const orderVal = orders.reduce((a, o) => a + orderCalc(o).value, 0);
  const orderQty = orders.reduce((a, o) => a + orderCalc(o).totalQty, 0);
  const prodQty = prods.reduce((a, p) => a + num(p.qty), 0);
  const prodVal = prods.reduce((a, p) => a + num(p.qty) * productCost(productById(p.productId)).perPc, 0);
  const wasteVal = waste.reduce((a, w) => a + wastageCost(w), 0);
  const cashIn = sales.filter(s => s.payMode === 'cash').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const upiIn = sales.filter(s => s.payMode === 'upi').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const credit = sales.filter(s => s.payMode === 'credit').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const expAmt = exps.reduce((a, e) => a + num(e.amount), 0);

  const orderRows = orders.map(o => ({ o: o, c: orderCalc(o), party: partyById(o.partyId) }));
  const supplyRows = supSales.map(s => ({ s: s, p: productById(s.productId), party: partyById(s.partyId) }));

  /* din-wise register (global period) */
  const dayRows = [];
  for (let x = P.from; x <= P.to; x = addDays(x, 1)) {
    const os = (DB.orders || []).filter(o => o.date === x);
    const ss = DB.sales.filter(s => s.date === x);
    const pp = DB.production.filter(p => p.date === x);
    const ww = (DB.wastage || []).filter(w => w.date === x);
    const ee = DB.expenses.filter(e => e.date === x);
    const oV = os.reduce((a, o) => a + orderCalc(o).value, 0);
    const sV = ss.reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
    if (!os.length && !ss.length && !pp.length && !ee.length && !ww.length) continue;
    dayRows.push({
      date: x, ordCnt: os.length, ordVal: oV, supVal: sV,
      supQty: ss.filter(s => s.channel === 'supply').reduce((a, s) => a + num(s.qty), 0),
      prodQty: pp.reduce((a, p) => a + num(p.qty), 0),
      waste: ww.reduce((a, w) => a + wastageCost(w), 0),
      exp: ee.reduce((a, e) => a + num(e.amount), 0)
    });
  }
  dayRows.reverse();
  const series = dayRows.slice().reverse().slice(-21).map(r => ({ label: dmyShort(r.date), short: dmyShort(r.date), a: r.ordVal, b: r.supVal }));

  return pageHead('Per Day Register', 'Order aaye · supply kiye · banaya · becha — ek hi jagah',
      '<div class="period"><button class="btn sm" data-act="dayShift" data-d="-1">◀</button>' +
        '<input type="date" id="dayInput" data-act="daySet" value="' + d + '">' +
        '<button class="btn sm" data-act="dayShift" data-d="1">▶</button></div>' +
      '<button class="btn" data-act="dayToday">Aaj</button>' +
      '<button class="btn" data-act="daySummary">📤 Summary</button>' +
      '<button class="btn primary" data-act="newOrder">+ Order</button>') +

    '<div class="kpis mb">' +
      tile('Orders aaye (' + dmy(d) + ')', orderRows.length, '<span>' + QTY(orderQty) + ' pcs · ' + INR0(orderVal) + '</span>') +
      tile('Supply kiye', INR0(supAmt), '<span>' + supSales.length + ' bill lines</span>') +
      tile('Total Sale', INR0(saleAmt), '<span>' + sales.length + ' entries</span>', 'green') +
      tile('Banaya', QTY(prodQty) + ' pcs', '<span>Cost ' + INR0(prodVal) + '</span>') +
      tile('Wastage', INR0(wasteVal), '<span>' + waste.length + ' entries</span>', wasteVal ? 'red' : '') +
      tile('Cash / UPI / Udhaar', INR0(cashIn) + ' / ' + INR0(upiIn), '<span>Udhaar ' + INR0(credit) + '</span>') +
    '</div>' +

    '<div class="grid cols-2 mb">' +
      card('Order aaye — ' + dmy(d), 'Pending order ko "Supply karein" se bill bana dein', '<span class="badge b-grey">' + orderRows.length + '</span>',
        tableHTML([
          { label: 'Party', render: r => '<b>' + esc(r.party ? r.party.name : '—') + '</b><div class="tiny muted">' + esc(r.party && r.party.area ? r.party.area : '') + '</div>' },
          { label: 'Items', render: r => (r.o.lines || []).map(l => '<span class="tag-inline">' + esc((productById(l.productId) || {}).name || '?') + ' ' + QTY(l.qty) + '</span>').join(' ') },
          { label: 'Value', cls: 'num', render: r => INR(r.c.value) },
          { label: 'Pending', cls: 'num', render: r => r.c.pending > 0 ? '<b>' + QTY(r.c.pending) + '</b>' : '<span class="muted">—</span>' },
          { label: 'Status', cls: 'center', render: r => orderBadge(r.c.status) },
          { label: '', render: r => r.c.pending > 0 ? '<button class="btn sm" data-act="supplyOrder" data-id="' + r.o.id + '">Supply</button>' : '' }
        ], orderRows, { compact: true, emptyTitle: 'Is din koi order nahi aaya', empty: 'Order aaye to "+ Order" se daalein.' }), { tight: true }) +
      card('Supply / Bills — ' + dmy(d), 'Is din kis party ko kya diya', '<span class="badge b-grey">' + supplyRows.length + '</span>',
        tableHTML([
          { label: 'Party', render: r => esc(r.party ? r.party.name : '—') },
          { label: 'Product', render: r => esc(r.p ? r.p.name : '—') },
          { label: 'Qty', cls: 'num', render: r => QTY(r.s.qty) },
          { label: 'Amount', cls: 'num', render: r => INR(num(r.s.qty) * num(r.s.rate)) },
          { label: 'Mode', render: r => payTag(r.s.payMode) },
          { label: '', render: r => r.s.invNo ? thermalBtns(r.s.invNo) : '' }
        ], supplyRows, { compact: true, emptyTitle: 'Is din supply nahi hui' }), { tight: true }) +
    '</div>' +

    '<div class="grid cols-2 mb">' +
      card('Production — ' + dmy(d), 'Us din kya bana', '',
        tableHTML([
          { label: 'Product', render: r => '<b>' + esc((productById(r.productId) || {}).name || '—') + '</b>' },
          { label: 'Batches', cls: 'num', render: r => QTY(r.batches) },
          { label: 'Qty', cls: 'num', render: r => '<b>' + QTY(r.qty) + '</b>' },
          { label: 'Cost', cls: 'num', render: r => INR(productCost(productById(r.productId)).perPc * num(r.qty)) }
        ], prods, { compact: true, emptyTitle: 'Is din production nahi hui' }), { tight: true }) +
      card('Kharcha / Wastage / Deposit — ' + dmy(d), 'Us din ka paisa bahar', '',
        tableHTML([
          { label: 'Type', render: r => r.kind === 'exp' ? '<span class="badge b-red">Kharcha</span>' : r.kind === 'waste' ? '<span class="badge b-amber">Wastage</span>' : '<span class="badge b-green">Deposit</span>' },
          { label: 'Detail', render: r => esc(r.text) },
          { label: 'Amount', cls: 'num', render: r => INR(r.amt) }
        ], exps.map(e => ({ kind: 'exp', text: e.category + (e.note ? ' · ' + e.note : ''), amt: num(e.amount) }))
          .concat(waste.map(w => ({ kind: 'waste', text: (productById(w.itemId) || {}).name + ' × ' + QTY(w.qty) + ' · ' + w.reason, amt: wastageCost(w) })))
          .concat(pays.map(x => ({ kind: 'dep', text: ((DB.agents || []).find(a => a.id === x.agentId) || {}).name + ' deposit', amt: num(x.amount) }))),
          { compact: true, emptyTitle: 'Is din koi kharcha nahi' }), { tight: true }) +
    '</div>' +

    card('Din-wise Order vs Supply', periodLabel() + ' · har din ka order aur supply value', '',
      dayRows.length ? dualBars(series) + '<div class="hr"></div>' + tableHTML([
        { label: 'Date', render: r => dmy(r.date) + ' <span class="tiny muted">' + weekday(r.date) + '</span>' },
        { label: 'Orders', cls: 'num', render: r => r.ordCnt || '—' },
        { label: 'Order Value', cls: 'num', render: r => r.ordVal ? INR0(r.ordVal) : '—' },
        { label: 'Supply Qty', cls: 'num', render: r => QTY(r.supQty) },
        { label: 'Sale (all)', cls: 'num', render: r => r.supVal ? INR0(r.supVal) : '—' },
        { label: 'Production', cls: 'num', render: r => QTY(r.prodQty) },
        { label: 'Wastage', cls: 'num', render: r => r.waste ? '<span class="neg">' + INR0(r.waste) + '</span>' : '—' },
        { label: 'Kharcha', cls: 'num', render: r => r.exp ? INR0(r.exp) : '—' }
      ], dayRows, { compact: true }) : '<div class="empty"><b>Is period me koi entry nahi</b>Period badal kar dekhein.</div>');
}

/* ================= VIEW: KYA CHAHIYE (requirements) ================= */
function viewNeeded() {
  const pend = pendingByProduct();
  const fg = finishedStock();
  const planQty = {};
  const planRows = Object.keys(pend).map(pid => {
    const p = productById(pid) || {};
    const orderQty = pend[pid];
    const stock = Math.max(0, fg[pid] || 0);
    const make = Math.max(0, orderQty - stock);
    if (make > 0) planQty[pid] = make;
    const yq = Math.max(0.0001, productCost(p).yieldQty);
    return { p: p, orderQty: orderQty, stock: stock, make: make, batches: r3(make / yq), cost: productCost(p).perPc * make };
  }).sort((a, b) => b.make - a.make);

  const req = ingredientRequirement(planQty);
  const stockMap = ingredientStock();
  const reqRows = Object.keys(req).map(ingId => {
    const ing = ingById(ingId) || { name: '?', unit: '', rate: 0 };
    const need = req[ingId];
    const have = Math.max(0, stockMap[ingId] || 0);
    const buy = Math.max(0, need - have);
    return { ing: ing, need: need, have: have, buy: buy, cost: buy * num(ing.rate) };
  }).filter(r => r.need > 0.0001).sort((a, b) => (b.buy * num(b.ing.rate)) - (a.buy * num(a.ing.rate)));

  const low = lowStockRows().map(r => ({ r: r, suggest: Math.max(0, r.min * 2 - r.stock), cost: Math.max(0, r.min * 2 - r.stock) * num(r.ing.rate) }));
  const outFG = DB.products.filter(p => Math.max(0, fg[p.id] || 0) <= 0).map(p => {
    const last30 = DB.sales.filter(s => s.productId === p.id && s.date >= addDays(TODAY, -29));
    const avg = last30.reduce((a, s) => a + num(s.qty), 0) / 30;
    return { p: p, avg: avg, suggest: Math.max(1, Math.ceil(avg * 3)) };
  }).filter(r => r.avg > 0);

  const totalBuyCost = reqRows.reduce((a, r) => a + r.cost, 0) + low.reduce((a, r) => a + r.cost, 0);

  return pageHead('Kya Chahiye', 'Pending order pura karne ke liye kya banana hai, kya kharidna hai',
      '<button class="btn" data-act="printReport" data-title="Requirement / Shopping List">Print</button>' +
      '<button class="btn primary" data-act="newPurchase">+ Purchase</button>') +

    '<div class="kpis mb">' +
      tile('Pending Order', QTY(Object.keys(pend).reduce((a, k) => a + pend[k], 0)) + ' pcs', '<span>' + Object.keys(pend).length + ' products</span>', 'amber') +
      tile('Banana Hai', QTY(Object.keys(planQty).reduce((a, k) => a + planQty[k], 0)) + ' pcs', '<span>' + planRows.filter(r => r.make > 0).length + ' products</span>') +
      tile('Kharidna Hai', reqRows.length + ' items', '<span>Approx ' + INR0(totalBuyCost) + '</span>') +
      tile('Low Stock', low.length, '<span>' + (low.length ? 'order karein' : 'sab theek') + '</span>', low.length ? 'red' : 'green') +
    '</div>' +

    card('1. Production Plan — kya banana hai', 'Pending order me se stock ghata kar jo banana hai', '<span class="badge b-grey">' + planRows.filter(r => r.make > 0).length + '</span>',
      tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b>' },
        { label: 'Pending Order', cls: 'num', render: r => QTY(r.orderQty) },
        { label: 'Stock hai', cls: 'num', render: r => QTY(r.stock) },
        { label: 'Banana hai', cls: 'num', render: r => r.make > 0 ? '<b>' + QTY(r.make) + '</b>' : '<span class="pos">pura ho jayega</span>' },
        { label: 'Batches', cls: 'num', render: r => r.make > 0 ? QTY(r.batches) : '—' },
        { label: 'Material Cost', cls: 'num', render: r => r.make > 0 ? INR(r.cost) : '—' },
        { label: '', render: r => r.make > 0 ? '<button class="btn sm" data-act="makeNow" data-id="' + r.p.id + '" data-qty="' + r.make + '">+ Batch</button>' : '' }
      ], planRows, { compact: true, emptyTitle: 'Koi pending order nahi', empty: 'Order aane par yahan production plan banega.' }), { tight: true }) +

    '<div class="mt">' + card('2. Raw Material — kya kharidna hai', 'Production plan ke hisaab se requirement vs stock', '<span class="badge b-grey">' + reqRows.length + '</span>',
      tableHTML([
        { label: 'Ingredient', render: r => '<b>' + esc(r.ing.name) + '</b><div class="tiny muted">' + esc(r.ing.vendor || '') + '</div>' },
        { label: 'Chahiye', cls: 'num', render: r => QTY(r.need) + ' ' + esc(r.ing.unit) },
        { label: 'Stock', cls: 'num', render: r => QTY(r.have) },
        { label: 'Kharidna hai', cls: 'num', render: r => r.buy > 0.0001 ? '<b class="neg">' + QTY(r.buy) + '</b>' : '<span class="pos">hai</span>' },
        { label: 'Rate', cls: 'num', render: r => INR(r.ing.rate) },
        { label: 'Approx Cost', cls: 'num', render: r => r.buy > 0.0001 ? INR(r.cost) : '—' },
        { label: '', render: r => r.buy > 0.0001 ? '<button class="btn sm" data-act="buyNow" data-id="' + r.ing.id + '" data-qty="' + r3(r.buy) + '">Purchase</button>' : '' }
      ], reqRows, {
        compact: true, emptyTitle: 'Abhi koi raw material requirement nahi', empty: 'Pending order ya production plan banne par yahan shopping list aayegi.',
        foot: reqRows.length ? '<tr><td>Total</td><td colspan="4"></td><td class="num">' + INR(reqRows.reduce((a, r) => a + r.cost, 0)) + '</td><td></td></tr>' : ''
      }), { tight: true }) + '</div>' +

    '<div class="grid cols-2 mt">' +
      card('3. Low Stock — reorder list', 'Minimum level se niche', '',
        tableHTML([
          { label: 'Item', render: r => '<b>' + esc(r.r.ing.name) + '</b><div class="tiny muted">' + esc(r.r.ing.vendor || '') + '</div>' },
          { label: 'Stock', cls: 'num', render: r => '<span class="' + (r.r.status === 'out' ? 'neg' : '') + '">' + QTY(r.r.stock) + '</span>' },
          { label: 'Min', cls: 'num', render: r => QTY(r.r.min) },
          { label: 'Order karein', cls: 'num', render: r => '<b>' + QTY(r.suggest) + '</b>' },
          { label: '', render: r => '<button class="btn sm" data-act="buyNow" data-id="' + r.r.ing.id + '" data-qty="' + r3(r.suggest) + '">Purchase</button>' }
        ], low, { compact: true, emptyTitle: 'Sab stock theek hai 👍' }), { tight: true }) +
      card('4. Finished stock khatam', 'Ye products bikne ke liye nahi hain', '',
        tableHTML([
          { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b>' },
          { label: 'Avg daily sale', cls: 'num', render: r => QTY(r.avg) },
          { label: 'Banayein (3 din)', cls: 'num', render: r => '<b>' + QTY(r.suggest) + '</b>' },
          { label: '', render: r => '<button class="btn sm" data-act="makeNow" data-id="' + r.p.id + '" data-qty="' + r.suggest + '">+ Batch</button>' }
        ], outFG, { compact: true, emptyTitle: 'Sab products ka stock hai 👍' }), { tight: true }) +
    '</div>';
}

/* ================= VIEW: MONTHLY EXPENSES ================= */
function viewMonthlyExpenses() {
  const months = Array.from(new Set(DB.expenses.map(e => monthKey(e.date)).concat([monthKey(TODAY)]))).sort().reverse();
  if (months.indexOf(EXP_MONTH) < 0) EXP_MONTH = months[0];
  const rows = DB.expenses.filter(e => monthKey(e.date) === EXP_MONTH);
  const total = rows.reduce((a, e) => a + num(e.amount), 0);
  const byCat = {}, byV = { bakery: 0, store: 0, supply: 0, common: 0 };
  rows.forEach(e => { addN(byCat, e.category, num(e.amount)); byV[e.vertical] = (byV[e.vertical] || 0) + num(e.amount); });
  const cats = Object.keys(byCat).map(k => ({ k: k, v: byCat[k], n: rows.filter(e => e.category === k).length })).sort((a, b) => b.v - a.v);
  const maxCat = Math.max.apply(null, cats.map(c => c.v).concat([1]));

  /* 6-month trend */
  const trend = months.slice(0, 6).reverse().map(m => ({
    label: monthName(m), short: MON[Number(m.slice(5, 7)) - 1],
    value: DB.expenses.filter(e => monthKey(e.date) === m).reduce((a, e) => a + num(e.amount), 0)
  }));

  /* category comparison to last month */
  const prevM = months[months.indexOf(EXP_MONTH) + 1];
  const prevByCat = {};
  if (prevM) DB.expenses.filter(e => monthKey(e.date) === prevM).forEach(e => addN(prevByCat, e.category, num(e.amount)));

  const wastage = (DB.wastage || []).filter(w => monthKey(w.date) === EXP_MONTH).reduce((a, w) => a + wastageCost(w), 0);
  const salary = byCat['Staff Salary'] || 0;

  return pageHead('Monthly Expenses', 'Mahine ka pura kharcha — category aur vertical wise',
      '<select class="btn" data-act="expMonth" style="padding-right:8px">' + months.map(m =>
        '<option value="' + m + '"' + (m === EXP_MONTH ? ' selected' : '') + '>' + monthName(m) + '</option>').join('') + '</select>' +
      '<button class="btn" data-act="printReport" data-title="Monthly Expenses — ' + monthName(EXP_MONTH) + '">Print</button>' +
      '<button class="btn primary" data-act="quickExpense">+ Kharcha</button>') +

    '<div class="kpis mb">' +
      tile(monthName(EXP_MONTH) + ' ka kharcha', INR0(total), '<span>' + rows.length + ' entries</span>', total ? 'red' : '') +
      tile('Salary', INR0(salary), '<span>' + (total ? Math.round(salary / total * 100) : 0) + '% of total</span>') +
      tile('Wastage (alag)', INR0(wastage), '<span>P&L me alag line</span>', wastage ? 'red' : '') +
      tile('Common kharche', INR0(byV.common), '<span>Sab vertical me baant</span>') +
      tile('Sabse bada kharcha', cats[0] ? esc(cats[0].k) : '—', '<span>' + (cats[0] ? INR0(cats[0].v) : '—') + '</span>') +
    '</div>' +

    '<div class="grid cols-2-1 mb">' +
      card('Category wise', 'Sabse bada kharcha sabse upar', '<span class="badge b-grey">' + cats.length + '</span>',
        tableHTML([
          { label: 'Category', render: r => '<b>' + esc(r.k) + '</b><div class="tiny muted">' + r.n + ' entries</div>' },
          { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.v) + '</b>' },
          { label: 'Share', cls: 'num', render: r => PCT(total ? r.v / total * 100 : 0) },
          { label: 'vs Pichhla mahina', cls: 'num', render: r => { const pv = prevByCat[r.k] || 0; if (!pv) return '<span class="muted tiny">naya</span>'; const d = (r.v - pv) / pv * 100; return '<span class="badge ' + (d <= 0 ? 'b-green' : 'b-red') + '">' + (d >= 0 ? '▲' : '▼') + ' ' + Math.abs(d).toFixed(0) + '%</span>'; } },
          { label: '', render: r => '<div class="bar" style="width:80px"><i style="width:' + (r.v / maxCat * 100).toFixed(1) + '%"></i></div>' }
        ], cats, {
          compact: true, emptyTitle: 'Is mahine koi kharcha nahi',
          foot: '<tr><td>Total</td><td class="num">' + INR(total) + '</td><td class="num">100%</td><td colspan="2"></td></tr>'
        }), { tight: true }) +
      card('6 mahine ka trend', 'Kharcha badh raha hai ya ghat raha', '', barChart(trend, { height: 168 }) +
        '<div class="hr"></div>' + CHANNELS.map(c => '<div class="vrow"><span class="k"><span class="dot ' + c.cls + '"></span> ' + c.label + '</span><span class="v">' + INR0(byV[c.id] || 0) + '</span></div>').join('') +
        '<div class="vrow"><span class="k"><span class="dot"></span> Common</span><span class="v">' + INR0(byV.common) + '</span></div>') +
    '</div>' +
    card('Entries — ' + monthName(EXP_MONTH), '', '',
      tableHTML([
        { label: 'Date', render: r => dmy(r.date) },
        { label: 'Vertical', render: r => '<span class="badge b-' + (r.vertical === 'bakery' ? 'amber' : r.vertical === 'store' ? 'teal' : r.vertical === 'supply' ? 'indigo' : 'grey') + '">' + (VLABEL[r.vertical] || r.vertical) + '</span>' },
        { label: 'Category', render: r => '<b>' + esc(r.category) + '</b>' + (r.note ? ' <span class="tiny muted">· ' + esc(r.note) + '</span>' : '') },
        { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.amount) + '</b>' },
        { label: '', render: r => '<button class="btn sm danger" data-act="delExpense" data-id="' + r.id + '">✕</button>' }
      ], rows.slice(0, 100), { compact: true, emptyTitle: 'Is mahine koi kharcha nahi' }), { tight: true });
}

/* ================= actions ================= */
Object.assign(ACT, {
  dayShift: d => { DAY = addDays(DAY, Number(d.d)); render(); },
  daySet: el => { DAY = el.value || TODAY; render(); },
  dayToday: () => { DAY = TODAY; render(); },
  expMonth: el => { EXP_MONTH = el.value; render(); },
  makeNow: d => productionModal({ productId: d.id, qty: num(d.qty) }),
  buyNow: d => purchaseModal({ ingId: d.id, qty: num(d.qty) }),
  newPurchase: () => purchaseModal()
});
