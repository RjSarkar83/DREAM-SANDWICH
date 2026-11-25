/* ================= SETUP / START ================= */
function setupProgress() {
  const steps = [
    { key: 'company', label: 'Company & opening balance', ok: !!(DB.meta.company && DB.meta.address), view: 'comp' },
    { key: 'ing', label: 'Ingredients + rate', ok: DB.ingredients.length > 0, view: 'ing' },
    { key: 'prod', label: 'Products + recipe', ok: DB.products.length > 0, view: 'prod' },
    { key: 'party', label: 'Parties (outlet / customer / vendor)', ok: DB.parties.length > 0, view: 'party' },
    { key: 'team', label: 'Staff & agents', ok: (DB.staff.length + (DB.agents || []).length) > 0, view: 'team' }
  ];
  return { steps: steps, done: steps.filter(s => s.ok).length, total: steps.length };
}

function viewSetup() {
  const pr = setupProgress();
  const pctDone = Math.round(pr.done / pr.total * 100);
  const stepRow = (n, title, desc, ok, actions) =>
    '<div style="display:flex;gap:12px;align-items:flex-start;padding:13px 0;border-bottom:1px solid var(--line2)">' +
      '<div style="width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:600;' +
        (ok ? 'background:var(--pos);color:#fff' : 'background:var(--soft);color:var(--muted)') + '">' + (ok ? '✓' : n) + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + title + '</div>' +
        '<div class="tiny muted">' + desc + '</div></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">' + actions + '</div>' +
    '</div>';

  return pageHead('Setup / Start', 'Business shuru karne ke liye bas ye 5 step — har step ek hi jagah se',
      '<button class="btn" data-act="loadDemo">Demo data dekhein</button>') +

    '<div class="card mb"><div class="card-body">' +
      '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px"><b style="font-size:14px">' + pr.done + ' / ' + pr.total + ' step ho gaye</b>' +
          '<div class="tiny muted">Sab step bharne ke baad daily entry shuru karein</div></div>' +
        '<div style="flex:1;min-width:180px"><div class="bar g"><i style="width:' + pctDone + '%"></i></div></div>' +
        '<div><b style="font-size:16px">' + pctDone + '%</b></div>' +
      '</div>' +
    '</div></div>' +

    card('Setup ke 5 step', 'Order se koi baat nahi — jis step se chahein shuru karein', '',
      stepRow(1, 'Company & opening balance', 'Naam, address, GSTIN, aur cash/bank ka opening balance (aaj ka cash jitna hai)', pr.steps[0].ok,
        '<button class="btn sm" data-act="editCompany">Bhar dein</button>') +
      stepRow(2, 'Ingredients + rate', 'Aapke paas abhi ' + DB.ingredients.length + ' ingredients hain — maida, cheeni, yeast, packaging…',
        pr.steps[1].ok,
        '<button class="btn sm" data-act="newIng">+ Ingredient</button>' +
        (DB.ingredients.length ? '<button class="btn sm" data-act="nav" data-view="ingredients">List</button>' : '')) +
      stepRow(3, 'Products + recipe', 'Aapke paas abhi ' + DB.products.length + ' products hain — har product ki recipe se cost nikalti hai', pr.steps[2].ok,
        '<button class="btn sm" data-act="newProduct">+ Product</button>' +
        (DB.products.length ? '<button class="btn sm" data-act="nav" data-view="bakeryProducts">List</button>' : '')) +
      stepRow(4, 'Parties', 'Outlets (supply), retail customers (udhaar) aur vendors — abhi ' + DB.parties.length + ' hain', pr.steps[3].ok,
        '<button class="btn sm" data-act="newParty">+ Party</button>') +
      stepRow(5, 'Staff & agents', 'Salary ke log aur delivery/payment collect karne wale agents — abhi ' +
        (DB.staff.length + (DB.agents || []).length) + ' hain', pr.steps[4].ok,
        '<button class="btn sm" data-act="newStaff">+ Staff</button><button class="btn sm" data-act="newAgent">+ Agent</button>')
    ) +

    '<div class="mt">' + card('Ab roz ka kaam', 'Ye 5 entry rozani karni hoti hain', '',
      '<div class="grid cols-3">' +
        '<div><b>1. Banaya (Production)</b><div class="tiny muted">Bakery → Production: bread/samosa banaye — raw material khud kam hoga</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="newProduction">+ Batch</button></div>' +
        '<div><b>2. Becha (Sales)</b><div class="tiny muted">Bakery/Store counter ya supply bill — customer billing yahin se</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="quickSale">+ Sale</button></div>' +
        '<div><b>3. Kharida (Purchase)</b><div class="tiny muted">Maal aaya to purchase bill — stock badhega</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="quickPurchase">+ Purchase</button></div>' +
        '<div><b>4. Kharcha</b><div class="tiny muted">Gas, bijli, rent, salary — vertical ke saath</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="quickExpense">+ Kharcha</button></div>' +
        '<div><b>5. Khatam hua (Wastage)</b><div class="tiny muted">Expire/damage maal — stock aur profit sahi rahega</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="newWastage">+ Wastage</button></div>' +
        '<div><b>Paisa mila?</b><div class="tiny muted">Udhaar wapas aaya to payment entry</div>' +
          '<button class="btn sm" style="margin-top:7px" data-act="newPayment">+ Payment</button></div>' +
      '</div>') + '</div>' +
    '<div class="mt tiny muted">Tip: pehle 10-15 din ki entry kar lein, phir Reports → P&L khol kar dekhein — aapka asli profit samne aayega.</div>';
}

/* ================= ORDERS (marketing supply) ================= */
function orderCalc(o) {
  let totalQty = 0, suppliedQty = 0, value = 0;
  (o.lines || []).forEach(l => {
    const sup = DB.sales.filter(s => s.orderId === o.id && s.productId === l.productId)
      .reduce((a, s) => a + num(s.qty), 0);
    l.supplied = r3(sup);
    totalQty += num(l.qty);
    suppliedQty += Math.min(sup, num(l.qty));
    value += num(l.qty) * num(l.rate);
  });
  const status = o.status === 'cancelled' ? 'cancelled'
    : suppliedQty <= 0.0001 ? 'pending'
      : suppliedQty >= totalQty - 0.0001 ? 'complete' : 'partial';
  return { totalQty: r3(totalQty), suppliedQty: r3(suppliedQty), pending: r3(Math.max(0, totalQty - suppliedQty)), value: r2(value), status: status };
}
const orderBadge = st => st === 'pending' ? '<span class="badge b-amber">Pending</span>'
  : st === 'partial' ? '<span class="badge b-indigo">Partial</span>'
    : st === 'complete' ? '<span class="badge b-green">Complete</span>' : '<span class="badge b-grey">Cancel</span>';

function viewOrderBook() {
  const all = (DB.orders || []).slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const rows = all.map(o => ({ o: o, c: orderCalc(o) }));
  const open = rows.filter(r => r.c.status === 'pending' || r.c.status === 'partial');
  const pendQty = open.reduce((a, r) => a + r.c.pending, 0);
  const pendVal = open.reduce((a, r) => a + r.c.pending * (r.c.value / Math.max(1, r.c.totalQty)), 0);
  const inPeriod = rows.filter(r => r.o.date >= P.from && r.o.date <= P.to);
  const periodVal = inPeriod.reduce((a, r) => a + r.c.value, 0);

  return pageHead('Orders', 'Order mila → yahan daalein → supply karne par bill ban jayega',
      '<button class="btn primary" data-act="newOrder">+ Naya Order</button>') +
    '<div class="kpis mb">' +
      tile('Open Orders', open.length, '<span>' + rows.length + ' total orders</span>') +
      tile('Supply Hona Baki', QTY(pendQty) + ' pcs', '<span>' + open.length + ' order me</span>', pendQty ? 'amber' : '') +
      tile('Pending Value (approx)', INR0(pendVal), '<span>Supply hone par milega</span>') +
      tile('Period ke Orders', INR0(periodVal), '<span>' + inPeriod.length + ' orders</span>') +
    '</div>' +
    card('Order Book', 'Pending order sabse upar rakhein',
      '<input class="btn" style="width:170px;cursor:text" placeholder="Party / product search" oninput="filterOrders(this.value)">',
      '<div id="orderWrap">' + orderTableHTML(rows) + '</div>', { tight: true });
}

function orderTableHTML(rows) {
  return tableHTML([
    { label: 'Date', render: r => dmy(r.o.date) + '<div class="tiny muted">' + weekday(r.o.date) + '</div>' },
    { label: 'Party', render: r => { const p = partyById(r.o.partyId); return '<b>' + esc(p ? p.name : '—') + '</b><div class="tiny muted">' + esc(p && p.area ? p.area : '') + '</div>'; } },
    { label: 'Items', render: r => (r.o.lines || []).map(l => '<span class="tag-inline">' + esc((productById(l.productId) || {}).name || '?') + ' ' + QTY(l.qty) + '</span>').join(' ') },
    { label: 'Order Value', cls: 'num', render: r => INR(r.c.value) },
    { label: 'Supply hua', cls: 'num', render: r => QTY(r.c.suppliedQty) + ' / ' + QTY(r.c.totalQty) },
    { label: 'Pending', cls: 'num', render: r => r.c.pending > 0 ? '<b>' + QTY(r.c.pending) + '</b>' : '<span class="muted">—</span>' },
    { label: 'Status', cls: 'center', render: r => orderBadge(r.c.status) },
    {
      label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
        (r.c.pending > 0 && r.c.status !== 'cancelled' ? '<button class="btn sm" data-act="supplyOrder" data-id="' + r.o.id + '">Supply karein</button>' : '') +
        '<button class="btn sm danger" data-act="delOrder" data-id="' + r.o.id + '">✕</button></div>'
    }
  ], rows, { compact: true, emptyTitle: 'Koi order nahi', empty: 'Jab outlet order de, "+ Naya Order" se daal dein.' });
}
function filterOrders(q) {
  const wrap = $('#orderWrap');
  if (!wrap) return;
  const qq = String(q || '').toLowerCase();
  const rows = (DB.orders || []).map(o => ({ o: o, c: orderCalc(o) })).filter(r => {
    if (!qq) return true;
    const p = partyById(r.o.partyId) || {};
    const names = (r.o.lines || []).map(l => (productById(l.productId) || {}).name).join(' ');
    return ((p.name || '') + ' ' + names).toLowerCase().indexOf(qq) > -1;
  });
  wrap.innerHTML = orderTableHTML(rows);
}

let ORD = null;
function orderModal() {
  if (!DB.products.length) { toast('Pehle ek product banayein (Bakery → Recipe & Cost)', 'err'); current = 'bakeryProducts'; render(); return; }
  if (!outlets().length) { toast('Pehle outlet party add karein (Reports → Udhaar/Party → + Naya Party)', 'err'); current = 'reportParty'; render(); return; }
  ORD = { date: TODAY, partyId: outlets()[0].id, note: '', lines: [{ productId: DB.products[0].id, qty: '10', rate: supplyRateOf(DB.products[0]) }] };
  drawOrder();
}

function drawOrder() {
  const lines = ORD.lines.map((l, i) => {
    const p = productById(l.productId) || {};
    return '<div class="linegrid">' +
      '<div class="field"><select class="ordProd" data-i="' + i + '">' + DB.products.map(x =>
        '<option value="' + x.id + '"' + (x.id === l.productId ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
      '<div class="field"><input type="text" class="ordQty" data-i="' + i + '" value="' + esc(l.qty) + '"></div>' +
      '<div class="field"><input type="text" class="ordRate" data-i="' + i + '" value="' + esc(l.rate) + '"></div>' +
      '<div class="field"><input type="text" class="ordAmt" data-i="' + i + '" readonly style="background:#fafafa" value="' + r2(num(l.qty) * num(l.rate)) + '"></div>' +
      '<button class="x-btn" data-act="ordDel" data-i="' + i + '">✕</button></div>';
  }).join('');

  openModal({
    title: 'Naya Order', sub: 'Outlet ka order — supply karne par pending qty khud kam hogi', width: 780,
    body:
      '<div class="fields">' +
        '<div class="field"><label>Order ki date</label><input type="date" id="ordDate" value="' + esc(ORD.date) + '"></div>' +
        '<div class="field"><label>Party / Outlet</label><select id="ordParty">' + outlets().map(o =>
          '<option value="' + o.id + '"' + (ORD.partyId === o.id ? ' selected' : '') + '>' + esc(o.name) + (o.area ? ' · ' + esc(o.area) : '') + '</option>').join('') + '</select></div>' +
        '<div class="field full"><label>Note (optional)</label><input id="ordNote" value="' + esc(ORD.note) + '" placeholder="jaise: kal subah tak chahiye"></div>' +
      '</div><div class="hr"></div>' +
      '<div class="lines-head"><div>Product</div><div>Qty</div><div>Rate ₹</div><div>Amount</div><div></div></div>' +
      lines + '<button class="btn sm" data-act="ordAdd" style="margin-top:6px">+ Item jodein</button>' +
      '<div class="calcbox" id="ordTotals"></div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="ordSave">Order save karein</button>'
  });

  const read = () => {
    ORD.date = $('#ordDate').value || TODAY;
    ORD.partyId = $('#ordParty').value;
    ORD.note = $('#ordNote').value;
    $$('#modalRoot .ordProd').forEach(el => { const i = +el.dataset.i; if (ORD.lines[i]) ORD.lines[i].productId = el.value; });
    $$('#modalRoot .ordQty').forEach(el => { const i = +el.dataset.i; if (ORD.lines[i]) ORD.lines[i].qty = el.value; });
    $$('#modalRoot .ordRate').forEach(el => { const i = +el.dataset.i; if (ORD.lines[i]) ORD.lines[i].rate = el.value; });
    const tot = ORD.lines.reduce((a, l) => a + num(l.qty) * num(l.rate), 0);
    $('#ordTotals').innerHTML = '<div class="cr"><span>Items</span><span>' + ORD.lines.length + '</span></div>' +
      '<div class="cr big"><span>Order value</span><span>' + INR(tot) + '</span></div>';
  };
  $$('#modalRoot .ordProd').forEach(el => el.addEventListener('change', () => {
    const i = +el.dataset.i; const p = productById(el.value);
    if (p && ORD.lines[i]) ORD.lines[i].rate = supplyRateOf(p);
    read(); drawOrder();
  }));
  $$('#modalRoot .ordQty, #modalRoot .ordRate').forEach(el => el.addEventListener('input', () => {
    read();
    $$('#modalRoot .ordAmt').forEach(a => { const i = +a.dataset.i; const l = ORD.lines[i]; if (l) a.value = r2(num(l.qty) * num(l.rate)); });
  }));
  $('#ordParty').addEventListener('change', read);
  $('#ordDate').addEventListener('change', read);
  $('#ordNote').addEventListener('input', read);
  read();
  $('#ordSave').onclick = () => {
    read();
    const valid = ORD.lines.filter(l => l.productId && num(l.qty) > 0 && num(l.rate) > 0);
    if (!valid.length) { toast('Kam se kam ek item daalein', 'err'); return; }
    DB.orders.push({
      id: uid('ord'), date: ORD.date, partyId: ORD.partyId, status: 'open', note: ORD.note,
      lines: valid.map(l => ({ productId: l.productId, qty: num(l.qty), rate: num(l.rate) }))
    });
    saveDB(); closeModal(); render();
    toast('Order save ho gaya', 'ok');
  };
}

/* ================= DEMAND ================= */
function viewDemand() {
  const prevDays = Math.max(1, daysBetween(P.from, P.to) + 1);
  const prevTo = addDays(P.from, -1), prevFrom = addDays(prevTo, -(prevDays - 1));

  const perParty = {};
  const add = (pid, key, val) => { const m = perParty[pid] || (perParty[pid] = { ordQty: 0, ordVal: 0, supVal: 0, supQty: 0, prevVal: 0 }); m[key] += val; };

  (DB.orders || []).forEach(o => {
    if (o.date < P.from || o.date > P.to) return;
    (o.lines || []).forEach(l => { add(o.partyId, 'ordQty', num(l.qty)); add(o.partyId, 'ordVal', num(l.qty) * num(l.rate)); });
  });
  DB.sales.filter(s => s.channel === 'supply').forEach(s => {
    const v = num(s.qty) * num(s.rate);
    if (s.date >= P.from && s.date <= P.to) { add(s.partyId, 'supVal', v); add(s.partyId, 'supQty', num(s.qty)); }
    else if (s.date >= prevFrom && s.date <= prevTo) add(s.partyId, 'prevVal', v);
  });

  const rows = Object.keys(perParty).map(pid => {
    const m = perParty[pid], p = partyById(pid);
    const demandVal = Math.max(m.ordVal, m.supVal);
    const growth = m.prevVal ? (m.supVal - m.prevVal) / m.prevVal * 100 : 0;
    return { party: p, name: p ? p.name : '—', area: p && p.area, ordQty: m.ordQty, supQty: m.supQty, supVal: m.supVal, ordVal: m.ordVal, demandVal: demandVal, growth: growth, prevVal: m.prevVal };
  }).sort((a, b) => b.demandVal - a.demandVal);
  const maxD = Math.max.apply(null, rows.map(r => r.demandVal).concat([1]));

  /* product wise demand */
  const perProd = {};
  (DB.orders || []).forEach(o => {
    if (o.date < P.from || o.date > P.to) return;
    (o.lines || []).forEach(l => perProd[l.productId] = (perProd[l.productId] || 0) + num(l.qty));
  });
  DB.sales.filter(s => s.channel === 'supply' && s.date >= P.from && s.date <= P.to)
    .forEach(s => perProd[s.productId] = (perProd[s.productId] || 0) + num(s.qty));
  const prodRows = Object.keys(perProd).map(pid => ({ name: (productById(pid) || {}).name || '—', qty: perProd[pid] }))
    .sort((a, b) => b.qty - a.qty).slice(0, 8);
  const maxPQ = Math.max.apply(null, prodRows.map(r => r.qty).concat([1]));

  return pageHead('Demand Analysis', 'Kis party aur kis product ki demand badh rahi hai · ' + periodLabel(),
      '<button class="btn" data-act="printReport" data-title="Demand Analysis">Print</button>') +
    (rows.length ? '' : card('Abhi data nahi', '', '',
      '<div class="empty"><b>Order ya supply entry karein</b>Phir yahan party-wise demand aur trend dikhega.<div style="margin-top:10px">' +
      '<button class="btn primary" data-act="newOrder">+ Naya Order</button></div></div>')) +
    (rows.length ? '<div class="grid cols-2-1">' +
      card('Party wise demand', 'Order + supply ke hisaab se', '',
        tableHTML([
          { label: 'Party', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.area || '') + '</div>' },
          { label: 'Ordered', cls: 'num', render: r => QTY(r.ordQty) },
          { label: 'Supplied', cls: 'num', render: r => QTY(r.supQty) },
          { label: 'Supply Value', cls: 'num', render: r => INR0(r.supVal) },
          { label: 'Trend', cls: 'num', render: r => r.prevVal ? '<span class="badge ' + (r.growth >= 0 ? 'b-green' : 'b-red') + '">' + (r.growth >= 0 ? '▲' : '▼') + ' ' + Math.abs(r.growth).toFixed(0) + '%</span>' : '<span class="muted tiny">naya</span>' },
          { label: 'Demand', render: r => '<div class="bar" style="width:90px"><i style="width:' + (r.demandVal / maxD * 100).toFixed(1) + '%"></i></div>' }
        ], rows, { compact: true }), { tight: true }) +
      card('Kis product ki demand', 'Order + supply qty milakar', '',
        prodRows.map(r => '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>' + esc(r.name) + '</span><b>' + QTY(r.qty) + '</b></div>' +
          '<div class="bar" style="margin-top:3px"><i style="width:' + (r.qty / maxPQ * 100).toFixed(1) + '%"></i></div></div>').join('')) +
      '</div>' : '');
}

/* ================= WASTAGE & STOCK ADJUST ================= */
function viewWastage() {
  const wrows = (DB.wastage || []).filter(w => w.date >= P.from && w.date <= P.to).sort((a, b) => a.date < b.date ? 1 : -1);
  const totalW = wrows.reduce((a, w) => a + wastageCost(w), 0);
  const prodQty = DB.production.filter(p => p.date >= P.from && p.date <= P.to).reduce((a, p) => a + num(p.qty), 0);
  const prodVal = DB.production.filter(p => p.date >= P.from && p.date <= P.to)
    .reduce((a, p) => a + num(p.qty) * productCost(productById(p.productId)).perPc, 0);
  const byReason = {};
  wrows.forEach(w => { byReason[w.reason] = (byReason[w.reason] || 0) + wastageCost(w); });
  const topReason = Object.keys(byReason).sort((a, b) => byReason[b] - byReason[a])[0];
  const adjRows = (DB.stockAdj || []).filter(a => a.date >= P.from && a.date <= P.to).sort((a, b) => a.date < b.date ? 1 : -1);

  return pageHead('Wastage & Stock Adjust', 'Khatam / expire / damage maal aur physical count ka correction',
      '<button class="btn" data-act="newAdjust">Stock adjust</button>' +
      '<button class="btn primary" data-act="newWastage">+ Wastage</button>') +
    '<div class="kpis mb">' +
      tile('Wastage (period)', INR0(totalW), '<span>' + wrows.length + ' entries</span>', totalW ? 'red' : 'green') +
      tile('Wastage % of production', prodVal ? (totalW / prodVal * 100).toFixed(1) + '%' : '—', '<span>Production value ' + INR0(prodVal) + '</span>', (prodVal && totalW / prodVal > .05) ? 'red' : '') +
      tile('Sabse zyada reason', topReason || '—', '<span>' + (topReason ? INR0(byReason[topReason]) : 'koi wastage nahi') + '</span>') +
      tile('Stock Adjustments', adjRows.length, '<span>Physical count correction</span>') +
    '</div>' +
    '<div class="grid cols-2">' +
      card('Wastage entries', 'Product khatam / expire hua — yahan daalein',
        '<span class="badge b-grey">' + wrows.length + '</span>',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Item', render: r => '<b>' + esc(r.itemType === 'product' ? ((productById(r.itemId) || {}).name || '—') : ((ingById(r.itemId) || {}).name || '—')) + '</b><div class="tiny muted">' + (r.itemType === 'product' ? 'Finished' : 'Raw material') + '</div>' },
          { label: 'Qty', cls: 'num', render: r => QTY(r.qty) },
          { label: 'Reason', render: r => '<span class="badge b-amber">' + esc(r.reason) + '</span>' },
          { label: 'Cost', cls: 'num', render: r => INR(wastageCost(r)) },
          { label: '', render: r => '<button class="btn sm danger" data-act="delWastage" data-id="' + r.id + '">✕</button>' }
        ], wrows, { compact: true, emptyTitle: 'Is period me wastage nahi', empty: 'Maal kharab hua to yahan entry karein — profit sahi rahega.' }), { tight: true }) +
      card('Stock adjustments', 'Physical count se stock theek karein', '',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Ingredient', render: r => '<b>' + esc((ingById(r.ingId) || {}).name || '—') + '</b>' },
          { label: 'Type', render: r => r.type === 'less' ? '<span class="badge b-red">Kam kiya</span>' : '<span class="badge b-green">Badhaya</span>' },
          { label: 'Qty', cls: 'num', render: r => QTY(r.qty) },
          { label: 'Reason', render: r => '<span class="tiny muted">' + esc(r.reason || '') + '</span>' },
          { label: '', render: r => '<button class="btn sm danger" data-act="delAdjust" data-id="' + r.id + '">✕</button>' }
        ], adjRows, { compact: true, emptyTitle: 'Koi adjustment nahi', empty: 'Mahine ke end me count karke adjust karein.' }), { tight: true }) +
    '</div>';
}

function wastageModal(optsW) {
  optsW = optsW || {};
  if (!DB.products.length && !DB.ingredients.length) { toast('Pehle product ya ingredient add karein', 'err'); return; }
  const opts = DB.products.map(p => ({ value: 'p:' + p.id, label: 'Product — ' + p.name }))
    .concat(DB.ingredients.map(i => ({ value: 'i:' + i.id, label: 'Raw — ' + i.name })));
  openForm({
    title: 'Wastage Entry', sub: 'Khatam / expire / damage maal — stock se turant kam hoga', width: 620,
    values: { date: TODAY, item: optsW.item || '', qty: optsW.qty ? String(r3(optsW.qty)) : '', reason: optsW.reason || 'Expiry' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'vertical', label: 'Kis vertical ka?', type: 'select', options: [{ value: 'bakery', label: 'Bakery' }, { value: 'store', label: 'Store / Stall' }, { value: 'supply', label: 'Marketing Supply' }] },
      { key: 'item', label: 'Item', type: 'select', options: opts, full: true },
      { key: 'qty', label: 'Qty', type: 'text', gold: true },
      { key: 'reason', label: 'Reason', type: 'select', options: ['Expiry', 'Damage', 'Over-production', 'Customer return', 'Other'] },
      { key: 'note', label: 'Note', type: 'text', full: true, placeholder: 'jaise: shaam ka bacha hua maal' }
    ],
    submit: 'Wastage save karein',
    onSubmit: d => {
      const q = num(d.qty);
      if (q <= 0) { toast('Qty daalein', 'err'); return false; }
      const isProd = String(d.item).indexOf('p:') === 0;
      const itemId = String(d.item).slice(2);
      DB.wastage.push({
        id: uid('w'), date: d.date || TODAY, vertical: d.vertical, itemType: isProd ? 'product' : 'ingredient',
        itemId: itemId, qty: q, reason: d.reason, note: d.note || ''
      });
      saveDB(); toast('Wastage saved · ' + INR0(wastageCost({ itemType: isProd ? 'product' : 'ingredient', itemId: itemId, qty: q })), 'ok');
    }
  });
}

function adjustModal() {
  if (!DB.ingredients.length) { toast('Pehle ingredient add karein', 'err'); return; }
  openForm({
    title: 'Stock Adjustment', sub: 'Physical count ke baad stock theek karein', width: 580,
    fields: [
      { key: 'date', label: 'Date', type: 'date', value: TODAY },
      { key: 'ingId', label: 'Ingredient', type: 'select', options: DB.ingredients.map(i => ({ value: i.id, label: i.name + ' (' + i.unit + ')' })) },
      { key: 'type', label: 'Kya karein', type: 'select', options: [{ value: 'add', label: 'Stock badhayein (+)' }, { value: 'less', label: 'Stock kam karein (−)' }] },
      { key: 'qty', label: 'Qty', type: 'text', gold: true },
      { key: 'reason', label: 'Reason', type: 'text', full: true, placeholder: 'jaise: physical count / leakage / extra mila' }
    ],
    submit: 'Adjust karein',
    onSubmit: d => {
      const q = num(d.qty);
      if (q <= 0) { toast('Qty daalein', 'err'); return false; }
      DB.stockAdj.push({ id: uid('sa'), date: d.date || TODAY, ingId: d.ingId, type: d.type, qty: q, reason: d.reason || 'Physical count', note: '' });
      saveDB(); toast('Stock adjust ho gaya', 'ok');
    }
  });
}

/* ================= AGENTS ================= */
function agentSummaryHTML() {
  const rows = agents().map(a => {
    const collected = DB.sales.filter(s => s.agentId === a.id && s.payMode === 'cash').reduce((x, s) => x + num(s.qty) * num(s.rate), 0);
    const deposited = (DB.agentDeposits || []).filter(d => d.agentId === a.id).reduce((x, d) => x + num(d.amount), 0);
    return { a: a, collected: r2(collected), deposited: r2(deposited), inHand: r2(collected - deposited) };
  });
  if (!rows.length) {
    return '<div class="empty"><b>Koi agent nahi</b>Delivery / collection wale bande ko add karein — unke haath ka cash track hoga.' +
      '<div style="margin-top:10px"><button class="btn primary" data-act="newAgent">+ Agent add karein</button></div></div>';
  }
  return tableHTML([
    { label: 'Agent', render: r => '<b>' + esc(r.a.name) + '</b><div class="tiny muted">' + esc(r.a.area || '') + (r.a.phone ? ' · ' + esc(r.a.phone) : '') + '</div>' },
    { label: 'Cash collect', cls: 'num', render: r => INR0(r.collected) },
    { label: 'Jama kiya', cls: 'num', render: r => INR0(r.deposited) },
    { label: 'Haath me', cls: 'num', render: r => '<b class="' + (r.inHand > 0 ? 'neg' : 'pos') + '">' + INR(r.inHand) + '</b>' },
    {
      label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
        '<button class="btn sm" data-act="agentDeposit" data-id="' + r.a.id + '">Jama karein</button>' +
        '<button class="btn sm" data-act="editAgent" data-id="' + r.a.id + '">Edit</button></div>'
    }
  ], rows, { compact: true });
}

function agentModal(id) {
  const a = id ? (DB.agents || []).find(x => x.id === id) : null;
  openForm({
    title: a ? 'Agent edit' : 'Naya Agent / Delivery', sub: 'Jo bande delivery karke cash collect karte hain', width: 560,
    values: a || {},
    fields: [
      { key: 'name', label: 'Naam', type: 'text', full: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'area', label: 'Area / Route', type: 'text' }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.name.trim()) { toast('Naam daalein', 'err'); return false; }
      if (!DB.agents) DB.agents = [];
      if (a) Object.assign(a, { name: d.name.trim(), phone: d.phone, area: d.area });
      else DB.agents.push({ id: uid('ag'), name: d.name.trim(), phone: d.phone, area: d.area });
      saveDB(); toast('Agent saved', 'ok');
    }
  });
}

function depositModal(agentId) {
  const a = (DB.agents || []).find(x => x.id === agentId);
  const bal = agentBalance(agentId);
  openForm({
    title: 'Agent ne cash jama kiya', sub: a ? esc(a.name) + ' — haath me ' + INR(bal) : '', width: 540,
    fields: [
      { key: 'date', label: 'Date', type: 'date', value: TODAY },
      { key: 'amount', label: 'Amount ₹', type: 'text', value: String(r2(bal)), gold: true },
      { key: 'mode', label: 'Kahan jama hua', type: 'select', options: [{ value: 'cash', label: 'Cash in Hand' }, { value: 'upi', label: 'Bank / UPI' }] },
      { key: 'note', label: 'Note', type: 'text', full: true }
    ],
    submit: 'Deposit save karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (amt <= 0) { toast('Amount daalein', 'err'); return false; }
      if (!DB.agentDeposits) DB.agentDeposits = [];
      DB.agentDeposits.push({ id: uid('dep'), date: d.date || TODAY, agentId: agentId, amount: r2(amt), mode: d.mode, note: d.note || '' });
      saveDB(); toast('Deposit saved', 'ok');
    }
  });
}

/* ================= actions ================= */
Object.assign(ACT, {
  newOrder: () => orderModal(),
  ordAdd: () => {
    const p = DB.products[0];
    ORD.lines.push({ productId: p.id, qty: '10', rate: supplyRateOf(p) });
    drawOrder();
  },
  ordDel: d => {
    ORD.lines.splice(+d.i, 1);
    if (!ORD.lines.length) ORD.lines.push({ productId: DB.products[0].id, qty: '10', rate: supplyRateOf(DB.products[0]) });
    drawOrder();
  },
  supplyOrder: d => {
    const o = (DB.orders || []).find(x => x.id === d.id);
    if (!o) return;
    const c = orderCalc(o);
    if (c.pending <= 0) { toast('Ye order pura supply ho chuka hai', 'warn'); return; }
    if (!DB.products.length) { toast('Product nahi hai', 'err'); return; }
    saleModal('supply', { orderId: o.id });
  },
  delOrder: d => confirmBox('Order delete karein? Iske against hui supply bills rahengi.', () => {
    DB.orders = DB.orders.filter(o => o.id !== d.id); saveDB(); render(); toast('Order delete', 'ok');
  }),
  newWastage: () => wastageModal(),
  newAdjust: () => adjustModal(),
  delWastage: d => confirmBox('Wastage entry delete karein?', () => {
    DB.wastage = DB.wastage.filter(w => w.id !== d.id); saveDB(); render(); toast('Entry delete', 'ok');
  }),
  delAdjust: d => confirmBox('Stock adjustment delete karein?', () => {
    DB.stockAdj = DB.stockAdj.filter(a => a.id !== d.id); saveDB(); render(); toast('Adjustment delete', 'ok');
  }),
  newAgent: () => agentModal(null),
  editAgent: d => agentModal(d.id),
  agentDeposit: d => depositModal(d.id),
  loadDemo: () => loadDemo()
});
