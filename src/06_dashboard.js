/* ================= DASHBOARD ================= */
function deltaChip(cur, old) {
  if (!old) return '<span class="badge b-grey">naya</span>';
  const d = (cur - old) / Math.abs(old) * 100;
  const cls = d >= 0 ? 'b-green' : 'b-red';
  return '<span class="badge ' + cls + '">' + (d >= 0 ? '▲' : '▼') + ' ' + Math.abs(d).toFixed(1) + '%</span>';
}

function viewDashboard() {
  const pl = plFor(P.from, P.to);
  const cash = cashPosition(P.from, P.to);
  const outs = outstandingList();
  const low = lowStockRows();
  const totOut = outs.reduce((a, o) => a + o.balance, 0);

  const days = Math.max(1, daysBetween(P.from, P.to) + 1);
  const prevTo = addDays(P.from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const prev = plFor(prevFrom, prevTo);

  const prods = productPL(P.from, P.to);
  const topProds = prods.slice(0, 6);

  const stockVal = stockRows().reduce((a, r) => a + r.value, 0);
  const fg = finishedStock();
  const fgVal = DB.products.reduce((a, p) => a + Math.max(0, fg[p.id] || 0) * productCost(p).perPc, 0);

  const seriesFrom = addDays(P.to, -20) < P.from ? P.from : addDays(P.to, -20);
  const series = dailySeries(seriesFrom, P.to);
  const todaySale = DB.sales.filter(s => s.date === TODAY).reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const todayProds = productPL(TODAY, TODAY);

  const expCats = {};
  DB.expenses.forEach(e => { if (inP(e.date)) expCats[e.category] = (expCats[e.category] || 0) + num(e.amount); });
  const expRows = Object.keys(expCats).map(k => ({ k, v: expCats[k] })).sort((a, b) => b.v - a.v).slice(0, 7);

  /* ---- vertical cards ---- */
  const vCards = CHANNELS.map(c => {
    const r = pl.channels[c.id];
    const share = pl.total.taxable ? r.taxable / pl.total.taxable * 100 : 0;
    return '<div class="vcard">' +
      '<div class="vh"><span class="dot ' + c.cls + '"></span><h4>' + c.label + '</h4>' +
        '<span class="badge b-grey" style="margin-left:auto">' + share.toFixed(0) + '% share</span></div>' +
      '<div class="vb">' +
        '<div class="vrow"><span class="k">Sales (GST chhod ke)</span><span class="v">' + INR0(r.taxable) + '</span></div>' +
        '<div class="vrow"><span class="k">Direct cost (material)</span><span class="v neg">−' + INR0(r.cogs) + '</span></div>' +
        '<div class="vrow"><span class="k">Gross profit</span><span class="v pos">' + INR0(r.gross) + ' <span class="muted tiny">(' + PCT(r.grossMarginPct) + ')</span></span></div>' +
        (r.wastage ? '<div class="vrow"><span class="k">Wastage</span><span class="v neg">−' + INR0(r.wastage) + '</span></div>' : '') +
        '<div class="vrow"><span class="k">Kharche</span><span class="v neg">−' + INR0(r.expenses) + '</span></div>' +
        '<div class="vrow total"><span class="k">Net profit</span><span class="v ' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + money(r.profit) + '</span></div>' +
        '<div class="bar ' + (r.profit >= 0 ? 'g' : 'r') + '" style="margin-top:9px"><i style="width:' + clamp(Math.abs(r.netMarginPct), 0, 100).toFixed(1) + '%"></i></div>' +
        '<div class="tiny muted" style="margin-top:4px">Net margin ' + PCT(r.netMarginPct) + ' · ' + r.bills + ' bills · ' + QTY(r.qty) + ' pcs</div>' +
        '<button class="btn sm" style="margin-top:9px" data-act="nav" data-view="' +
          (c.id === 'bakery' ? 'bakerySales' : c.id === 'store' ? 'storeSales' : 'supplyOrders') + '">Detail dekho</button>' +
      '</div></div>';
  }).join('');

  /* ---- alerts ---- */
  let alerts = '';
  low.slice(0, 6).forEach(r => {
    alerts += '<div class="alert' + (r.status === 'out' ? ' red' : '') + '"><span class="ic">' + (r.status === 'out' ? '⛔' : '⚠️') + '</span>' +
      '<div><b>' + esc(r.ing.name) + '</b> — ' + (r.status === 'out' ? 'stock khatam' : 'stock kam') +
      '<div class="tiny muted">Bacha ' + QTY(r.stock) + ' ' + esc(r.ing.unit) + ' · minimum ' + QTY(r.min) + ' ' + esc(r.ing.unit) + '</div></div></div>';
  });
  outs.filter(o => o.overLimit).slice(0, 4).forEach(o => {
    alerts += '<div class="alert"><span class="ic">💳</span><div><b>' + esc(o.party.name) + '</b> ka udhaar limit se zyada' +
      '<div class="tiny muted">Baki ' + INR0(o.balance) + ' · limit ' + INR0(o.party.creditLimit) + '</div></div></div>';
  });
  if (!alerts) alerts = '<div class="empty"><b>Sab theek hai 👍</b>Koi stock ya udhaar alert nahi.</div>';

  const blank = isBlankDB(DB);
  return (blank ? '<div class="card mb" style="border-color:#e5e7eb"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><b>Abhi data khali hai</b>' +
      '<div class="tiny muted">Setup ke 5 step bhar lein — company, ingredients, products, parties, staff. Uske baad daily entry shuru karein.</div></div>' +
      '<button class="btn primary" data-act="nav" data-view="setup">Setup shuru karein</button>' +
      '<button class="btn" data-act="loadDemo">Demo dekh kar samjhein</button>' +
    '</div></div>' : '') +
    (typeof backupBanner === 'function' ? backupBanner() : '') +
    pageHead('Dashboard', 'Ek nazar me teeno business ka hisaab · ' + periodLabel(),
      '<button class="btn" data-act="nav" data-view="reportPnl">P&L report</button>' +
      '<button class="btn primary" data-act="quickSale">+ Naya Sale</button>') +

    (typeof targetCard === 'function' ? targetCard() : '') +

    '<div class="kpis mb">' +
      tile('Aaj ki Sale', INR0(todaySale), '<span>' + DB.sales.filter(s => s.date === TODAY).length + ' bills · ' + todayProds.reduce((a, p) => a + p.qty, 0) + ' pcs</span>') +
      tile('Net Sales', INR0(pl.total.taxable), deltaChip(pl.total.taxable, prev.total.taxable) + '<span>Gross ' + INR0(pl.total.sales) + '</span>') +
      tile('Net Profit', money(pl.total.net),
        deltaChip(pl.total.net, prev.total.net) + '<span class="badge b-' + (pl.total.net >= 0 ? 'green' : 'red') + '">' + PCT(pl.total.netMarginPct) + '</span>', pl.total.net >= 0 ? 'green' : 'red') +
      tile('Udhaar (lena hai)', INR0(totOut), '<span>' + outs.length + ' party</span>' + (outs.filter(o => o.overLimit).length ? '<span class="badge b-red">' + outs.filter(o => o.overLimit).length + ' limit cross</span>' : '')) +
      tile('Cash + Bank (net)', money(cash.net), '<span>In ' + INR0(cash.cashIn + cash.upiIn) + ' · Out ' + INR0(cash.cashOut) + '</span>') +
      tile('Stock Value', INR0(stockVal + fgVal), '<span>Material ' + INR0(stockVal) + (low.length ? ' · ' + low.length + ' low' : '') + '</span>') +
    '</div>' +

    '<div class="section-title"><div><h2>Teeno vertical ka P&L</h2><div class="sub">Har business ka cost, sales aur profit alag-alag</div></div>' +
      '<button class="btn sm" data-act="nav" data-view="reportPnl">Full P&L report →</button></div>' +
    '<div class="grid cols-3 mb">' + vCards + '</div>' +

    '<div class="grid cols-2-1 mb">' +
      card('Sales Trend', 'Pichhle din ka daily sale (GST inclusive)', '', barChart(series, { height: 176 }), { tight: false }) +
      card('Dhyan dein', 'Stock aur udhaar alerts', '<span class="badge b-amber">' + (low.length + outs.filter(o => o.overLimit).length) + '</span>', alerts) +
    '</div>' +

    '<div class="grid cols-2-1">' +
      card('Top Products — Profit ke hisaab se', periodLabel(),
        '<button class="btn sm" data-act="nav" data-view="reportProduct">Sab products →</button>',
        tableHTML([
          { label: 'Product', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.category) + '</div>' },
          { label: 'Qty', cls: 'num', render: r => QTY(r.qty) },
          { label: 'Sales', cls: 'num', render: r => INR0(r.taxable) },
          { label: 'Cost', cls: 'num', render: r => INR0(r.cogs) },
          { label: 'Profit', cls: 'num', render: r => '<span class="' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + INR0(r.profit) + '</span>' },
          { label: 'Margin', cls: 'num', render: r => '<span class="badge b-' + (r.marginPct >= 25 ? 'green' : r.marginPct >= 10 ? 'amber' : 'red') + '">' + PCT(r.marginPct) + '</span>' }
        ], topProds, { compact: true, emptyTitle: 'Is period me sale nahi hui' }), { tight: true }) +
      card('Kharche — category wise', periodLabel() + ' · total ' + INR0(pl.total.expenses), '',
        expRows.length ? expRows.map(r =>
          '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12.4px"><span>' + esc(r.k) + '</span><b>' + INR0(r.v) + '</b></div>' +
          '<div class="bar a" style="margin-top:3px"><i style="width:' + (r.v / expRows[0].v * 100).toFixed(1) + '%"></i></div></div>'
        ).join('') : '<div class="empty">Is period me koi kharcha nahi</div>') +
    '</div>';
}
