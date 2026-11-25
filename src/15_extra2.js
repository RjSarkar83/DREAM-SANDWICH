/* ================= CASH BOOK · PARTY RATE LIST · BATCH / EXPIRY ================= */
let CB_MODE = 'cash';
let RL = '';

/* ---------------------------- 1. CASH BOOK ---------------------------- */
function cashLedger(mode) {
  const ev = [];
  DB.sales.forEach(s => {
    if (s.payMode !== mode) return;
    ev.push({ date: s.date, kind: 'sale', desc: (productById(s.productId) || {}).name || 'Sale', party: (partyById(s.partyId) || {}).name || '', in: r2(num(s.qty) * num(s.rate)), out: 0 });
  });
  DB.purchases.forEach(p => {
    if (p.payMode !== mode) return;
    ev.push({ date: p.date, kind: 'purchase', desc: 'Purchase', party: (partyById(p.partyId) || {}).name || '', in: 0, out: r2(num(p.amount)) });
  });
  if (mode === 'cash') DB.expenses.forEach(e => {
    ev.push({ date: e.date, kind: 'expense', desc: e.category + (e.note ? ' · ' + e.note : ''), party: VLABEL[e.vertical] || '', in: 0, out: r2(num(e.amount)) });
  });
  (DB.payments || []).forEach(p => {
    if (p.mode !== mode) return;
    ev.push({ date: p.date, kind: 'receipt', desc: 'Payment mila' + (p.note ? ' · ' + p.note : ''), party: (partyById(p.partyId) || {}).name || '', in: r2(num(p.amount)), out: 0 });
  });
  (DB.agentDeposits || []).forEach(x => {
    if (x.mode !== mode) return;
    ev.push({ date: x.date, kind: 'deposit', desc: 'Agent paisa jama', party: ((DB.agents || []).find(a => a.id === x.agentId) || {}).name || '', in: r2(num(x.amount)), out: 0 });
  });
  (DB.vendorPayments || []).forEach(x => {
    if (x.mode !== mode) return;
    ev.push({ date: x.date, kind: 'vpay', desc: 'Vendor payment' + (x.note ? ' · ' + x.note : ''), party: (partyById(x.partyId) || {}).name || '', in: 0, out: r2(num(x.amount)) });
  });
  return ev.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}

function viewCashBook() {
  const mode = CB_MODE;
  const open = mode === 'cash' ? num(DB.meta.openingCash) : num(DB.meta.openingBank);
  const ev = cashLedger(mode);
  const before = ev.filter(e => e.date < P.from);
  let bal = open + before.reduce((a, e) => a + e.in - e.out, 0);
  const openBal = bal;

  const dayRows = [];
  for (let x = P.from; x <= P.to; x = addDays(x, 1)) {
    const list = ev.filter(e => e.date === x);
    const cin = list.reduce((a, e) => a + e.in, 0), cout = list.reduce((a, e) => a + e.out, 0);
    if (!list.length) continue;
    const ob = bal;
    bal = r2(bal + cin - cout);
    dayRows.push({ date: x, ob: ob, cin: cin, cout: cout, cb: bal, n: list.length });
  }
  dayRows.reverse();

  const todayEv = ev.filter(e => e.date === DAY);
  const todayIn = todayEv.reduce((a, e) => a + e.in, 0), todayOut = todayEv.reduce((a, e) => a + e.out, 0);
  const totalIn = dayRows.reduce((a, r) => a + r.cin, 0), totalOut = dayRows.reduce((a, r) => a + r.cout, 0);

  const KIND = { sale: 'Sale', purchase: 'Purchase', expense: 'Kharcha', receipt: 'Payment mila', deposit: 'Agent deposit', vpay: 'Vendor payment' };
  const KINDCLS = { sale: 'b-green', purchase: 'b-amber', expense: 'b-red', receipt: 'b-teal', deposit: 'b-indigo', vpay: 'b-grey' };

  return pageHead('Cash Book', (mode === 'cash' ? 'Cash in hand' : 'Bank / UPI') + ' ka roz ka hisaab — ' + periodLabel(),
      '<button class="btn' + (mode === 'cash' ? ' primary' : '') + '" data-act="cbMode" data-m="cash">Cash</button>' +
      '<button class="btn' + (mode === 'upi' ? ' primary' : '') + '" data-act="cbMode" data-m="upi">Bank / UPI</button>' +
      '<button class="btn" data-act="printReport" data-title="Cash Book">Print</button>') +

    '<div class="kpis mb">' +
      tile('Opening (' + dmy(P.from) + ')', INR0(openBal), '<span>' + (mode === 'cash' ? 'Cash in hand' : 'Bank') + '</span>') +
      tile('Period me aaya', INR0(totalIn), '<span>' + dayRows.length + ' din ki entry</span>', 'green') +
      tile('Period me gaya', INR0(totalOut), '<span>kharcha + purchase</span>', 'red') +
      tile('Closing balance', INR0(r2(openBal + totalIn - totalOut)), '<span>' + dmy(P.to) + ' tak</span>', 'green') +
      tile(dmy(DAY) + ' (aaj)', INR0(todayIn - todayOut), '<span>In ' + INR0(todayIn) + ' · Out ' + INR0(todayOut) + '</span>') +
    '</div>' +

    '<div class="grid cols-2-1">' +
      card('Din-wise Cash Book', 'Har din opening → andar → bahar → closing', '<span class="badge b-grey">' + dayRows.length + ' din</span>',
        tableHTML([
          { label: 'Date', render: r => '<b>' + dmy(r.date) + '</b><div class="tiny muted">' + weekday(r.date) + '</div>' },
          { label: 'Opening', cls: 'num', render: r => INR0(r.ob) },
          { label: 'Andar', cls: 'num', render: r => r.cin ? '<span class="pos">' + INR0(r.cin) + '</span>' : '—' },
          { label: 'Bahar', cls: 'num', render: r => r.cout ? '<span class="neg">' + INR0(r.cout) + '</span>' : '—' },
          { label: 'Closing', cls: 'num', render: r => '<b>' + INR0(r.cb) + '</b>' },
          { label: 'Entries', cls: 'num', render: r => r.n }
        ], dayRows, {
          compact: true, emptyTitle: 'Is period me koi cash entry nahi',
          foot: '<tr><td>Total</td><td class="num">' + INR0(openBal) + '</td><td class="num">' + INR0(totalIn) + '</td><td class="num">' + INR0(totalOut) + '</td><td class="num">' + INR0(r2(openBal + totalIn - totalOut)) + '</td><td></td></tr>'
        }), { tight: true }) +
      card(dmy(DAY) + ' ka detail', 'Is din exactly kya aaya aur kya gaya', '',
        '<div style="margin-bottom:8px"><input type="date" data-act="daySet" value="' + DAY + '" style="width:100%"></div>' +
        tableHTML([
          { label: 'Type', render: r => '<span class="badge ' + (KINDCLS[r.kind] || 'b-grey') + '">' + (KIND[r.kind] || r.kind) + '</span>' },
          { label: 'Detail', render: r => esc(r.desc) + (r.party ? '<div class="tiny muted">' + esc(r.party) + '</div>' : '') },
          { label: 'In', cls: 'num', render: r => r.in ? '<span class="pos">' + INR0(r.in) + '</span>' : '' },
          { label: 'Out', cls: 'num', render: r => r.out ? '<span class="neg">' + INR0(r.out) + '</span>' : '' }
        ], todayEv, {
          compact: true, emptyTitle: 'Is din koi cash entry nahi',
          foot: todayEv.length ? '<tr><td colspan="2">Net</td><td class="num">' + INR0(todayIn) + '</td><td class="num">' + INR0(todayOut) + '</td></tr>' : ''
        }), { tight: true }) +
    '</div>';
}

/* ---------------------------- 2. PARTY RATE LIST ---------------------------- */
function partyRate(partyId, p, channel) {
  const party = partyId ? partyById(partyId) : null;
  const own = party && party.rates ? num(party.rates[p.id]) : 0;
  return own > 0 ? own : rateFor(p, channel);
}

function viewPartyRates() {
  const list = DB.parties.filter(p => p.type !== 'vendor');
  if (!DB.products.length) {
    return pageHead('Party Rate List', 'Har party ka apna rate', '') +
      '<div class="empty"><b>Pehle product banayein</b>Recipe & Cost me product add karne ke baad rate list yahan banegi.' +
      '<div style="margin-top:10px"><button class="btn primary" data-act="newProduct">+ Product</button></div></div>';
  }
  if (!list.length) {
    return pageHead('Party Rate List', 'Har party ka apna rate', '') +
      '<div class="empty"><b>Koi party nahi hai</b>Outlet / customer add karein, phir unka rate set karein.' +
      '<div style="margin-top:10px"><button class="btn primary" data-act="newParty">+ Party</button></div></div>';
  }
  if (!RL || !partyById(RL)) RL = list[0].id;
  const party = partyById(RL);
  const rates = party.rates || {};
  const rows = DB.products.map(p => {
    const c = productCost(p), list1 = priceOf(p), sup = supplyRateOf(p);
    const own = num(rates[p.id]);
    const use = own > 0 ? own : (party.type === 'outlet' ? sup : list1);
    return { p: p, cost: c.perPc, list1: list1, sup: sup, own: own, use: use, margin: use > 0 ? (use - c.perPc) / use * 100 : 0 };
  });
  const setCount = Object.keys(rates).filter(k => num(rates[k]) > 0).length;

  return pageHead('Party Rate List', 'Har outlet / customer ka apna selling rate — bill me ye rate auto aayega',
      '<select class="btn" data-act="rlParty" style="min-width:200px">' + list.map(p =>
        '<option value="' + p.id + '"' + (p.id === RL ? ' selected' : '') + '>' + (p.type === 'customer' ? 'Customer · ' : 'Outlet · ') + esc(p.name) + '</option>').join('') + '</select>' +
      '<button class="btn primary" data-act="rlSave">Rate save karein</button>') +

    '<div class="kpis mb">' +
      tile('Party', esc(party.name), '<span>' + (party.type === 'customer' ? 'Retail customer' : 'Outlet') + (party.area ? ' · ' + esc(party.area) : '') + '</span>') +
      tile('Special rate set', setCount + ' / ' + DB.products.length, '<span>' + (setCount ? 'bill me auto lagega' : 'abhi normal rate chal raha hai') + '</span>') +
      tile('Normal supply rate', INR0(supplyRateOf(DB.products[0])), '<span>baaki products ka apna rate</span>') +
      tile('Udhaar baki', INR0(partyBalance(party.id).receivable), '<span>ledger me dekhein</span>', partyBalance(party.id).receivable > 0 ? 'red' : '') +
    '</div>' +

    card('Rate List — ' + esc(party.name), 'Khaali chhod dein to normal rate chalega (counter ' + INR0(priceOf(DB.products[0])) + ' / supply ' + INR0(supplyRateOf(DB.products[0])) + ')', '',
      '<div id="rlBody">' + tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b><div class="tiny muted">' + esc(r.p.unit || 'pc') + ' · cost ' + INR(r.cost) + '</div>' },
        { label: 'Counter rate', cls: 'num', render: r => INR(r.list1) },
        { label: 'Supply rate', cls: 'num', render: r => INR(r.sup) },
        { label: 'Party ka rate ₹', cls: 'num', render: r => '<input type="text" class="rlRate" data-pid="' + r.p.id + '" value="' + (r.own > 0 ? r3(r.own) : '') + '" placeholder="' + r3(r.sup) + '" style="width:100px;text-align:right">' },
        { label: 'Lagta hai', cls: 'num', render: r => '<b>' + INR(r.use) + '</b>' },
        { label: 'Margin', cls: 'num', render: r => '<span class="badge ' + (r.margin >= 25 ? 'b-green' : r.margin >= 10 ? 'b-amber' : 'b-red') + '">' + PCT(r.margin) + '</span>' }
      ], rows, { compact: true }) + '</div>', { tight: true }) +
    '<div class="tiny muted mt">Tip: rate khaali chhodne par counter/supply ka normal rate lagega. Sirf special party ke liye rate bharein.</div>';
}

/* ---------------------------- 3. BATCH / EXPIRY ---------------------------- */
function batchList() {
  const out = [];
  DB.products.forEach(p => {
    const life = num(p.shelfLife) || 3;
    const bs = DB.production.filter(x => x.productId === p.id).slice()
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    let consumed = DB.sales.filter(s => s.productId === p.id).reduce((a, s) => a + num(s.qty), 0)
      + (DB.wastage || []).filter(w => w.itemType === 'product' && w.itemId === p.id).reduce((a, w) => a + num(w.qty), 0);
    bs.forEach((b, i) => {
      const qty = num(b.qty);
      const take = Math.min(qty, Math.max(0, consumed));
      consumed -= take;
      out.push({
        p: p, b: b, qty: qty, left: r3(qty - take),
        batchNo: b.batchNo || ('B' + (b.date || '').slice(8, 10) + (b.date || '').slice(5, 7) + '-' + (i + 1)),
        expiry: b.expiry || addDays(b.date, life), life: life
      });
    });
  });
  return out;
}

function viewBatch() {
  const all = batchList();
  const live = all.filter(b => b.left > 0.0001);
  const withDays = live.map(b => Object.assign({}, b, { days: daysBetween(TODAY, b.expiry), value: b.left * productCost(b.p).perPc }));
  const expired = withDays.filter(b => b.days < 0).sort((a, b) => a.expiry < b.expiry ? -1 : 1);
  const soon = withDays.filter(b => b.days >= 0 && b.days <= 2).sort((a, b) => a.expiry < b.expiry ? -1 : 1);
  const fresh = withDays.filter(b => b.days > 2).sort((a, b) => a.expiry < b.expiry ? -1 : 1);
  const risk = expired.concat(soon).reduce((a, b) => a + b.value, 0);
  const noLife = DB.products.filter(p => !num(p.shelfLife)).length;

  const rowBtn = r => '<button class="btn sm danger" data-act="batWaste" data-id="' + r.p.id + '" data-qty="' + r.left + '">Wastage</button>';
  const tbl = (rows, emptyT, emptyS) => tableHTML([
    { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b><div class="tiny muted">' + esc(r.batchNo) + '</div>' },
    { label: 'Banaya', render: r => dmy(r.b.date) },
    { label: 'Expiry', render: r => '<b>' + dmy(r.expiry) + '</b><div class="tiny muted">' + (r.days < 0 ? Math.abs(r.days) + ' din pehle' : r.days + ' din bache') + '</div>' },
    { label: 'Bacha qty', cls: 'num', render: r => '<b>' + QTY(r.left) + '</b><div class="tiny muted">of ' + QTY(r.qty) + '</div>' },
    { label: 'Value', cls: 'num', render: r => INR(r.value) },
    { label: '', render: rowBtn }
  ], rows, { compact: true, emptyTitle: emptyT, empty: emptyS });

  return pageHead('Batch & Expiry', 'Kaunsa batch kab expire hoga — pehle wala pehle bikna chahiye (FIFO)',
      '<button class="btn" data-act="printReport" data-title="Batch / Expiry">Print</button>' +
      '<button class="btn primary" data-act="newProduction">+ Batch</button>') +

    '<div class="kpis mb">' +
      tile('Live batches', live.length, '<span>' + all.length + ' total made</span>') +
      tile('Expired (stock bacha)', expired.length, '<span>' + INR0(expired.reduce((a, b) => a + b.value, 0)) + ' nuksan</span>', expired.length ? 'red' : 'green') +
      tile('2 din me expire', soon.length, '<span>' + INR0(soon.reduce((a, b) => a + b.value, 0)) + ' value</span>', soon.length ? 'amber' : '') +
      tile('Risk value', INR0(risk), '<span>expire + jaldi expire</span>') +
    '</div>' +

    (expired.length ? card('Expired — turant wastage daalein', 'Ye maal bech nahi sakte, stock me pada hai', '<span class="badge b-red">' + expired.length + '</span>', tbl(expired, '', ''), { tight: true }) + '<div class="mt"></div>' : '') +
    (soon.length ? card('2 din me expire hoga', 'Pehle bech dein ya supply me pehle bhejein', '<span class="badge b-amber">' + soon.length + '</span>', tbl(soon, '', ''), { tight: true }) + '<div class="mt"></div>' : '') +

    (typeof ingAgeingCard === 'function' ? '<div class="mb">' + ingAgeingCard() + '</div>' : '') +
    '<div class="grid cols-2">' +
      card('Fresh stock (batch wise)', 'Sabse pehle expire hone wala sabse upar', '<span class="badge b-grey">' + fresh.length + '</span>',
        tbl(fresh.slice(0, 40), 'Koi fresh batch nahi', 'Production karne par yahan batch-wise stock dikhega.'), { tight: true }) +
      card('Shelf life set karein', 'Product ke hisaab se expiry auto nikalti hai', '',
        !DB.products.length ? '<div class="empty"><b>Pehle product banayein</b>Recipe & Cost me product add karein.</div>' :
        noLife ? '<div class="tiny" style="margin-bottom:8px;color:#b45309">' + noLife + ' product me shelf life nahi bhari — default 3 din maan liya gaya hai.</div>' : '<div class="tiny muted" style="margin-bottom:8px">Sab products me shelf life set hai 👍</div>' +
        tableHTML([
          { label: 'Product', render: p => '<b>' + esc(p.name) + '</b>' },
          { label: 'Shelf life', cls: 'num', render: p => '<b>' + (num(p.shelfLife) || 3) + ' din</b>' },
          { label: '', render: p => '<button class="btn sm" data-act="editProduct" data-id="' + p.id + '">Set</button>' }
        ], DB.products, { compact: true }), { tight: true }) +
    '</div>';
}

Object.assign(ACT, {
  cbMode: d => { CB_MODE = d.m; render(); },
  rlParty: el => { RL = el.value; render(); },
  rlSave: () => {
    const party = partyById(RL);
    if (!party) { toast('Party chunein', 'err'); return; }
    const rates = {};
    $$('#rlBody .rlRate').forEach(inp => {
      const v = String(inp.value || '').trim();
      if (v !== '' && num(v) > 0) rates[inp.dataset.pid] = r2(num(v));
    });
    party.rates = rates;
    saveDB(); render();
    toast('Rate list save ho gayi · ' + Object.keys(rates).length + ' products', 'ok');
  },
  batWaste: d => wastageModal({ item: 'p:' + d.id, qty: num(d.qty), reason: 'Expiry' })
});
