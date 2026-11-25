/* ================= REPORTS ================= */
function exportCSV(name, headers, rows) {
  const csv = [headers.join(',')].concat(rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(','))).join('\n');
  try {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    toast('CSV download ho gaya: ' + name, 'ok');
  } catch (e) { toast('Download block hai — file browser me kholein', 'warn'); }
}

const plCell = (v, bold) => '<td class="num">' + (bold ? '<b>' : '') + (v < 0 ? '<span class="neg">' + money(v) + '</span>' : INR(v)) + (bold ? '</b>' : '') + '</td>';
const pctCell = v => '<td class="num"><span class="badge b-' + (v >= 20 ? 'green' : v >= 8 ? 'amber' : v >= 0 ? 'grey' : 'red') + '">' + PCT(v) + '</span></td>';

function viewReportPnl() {
  const pl = plFor(P.from, P.to);
  const ch = CHANNELS.map(c => pl.channels[c.id]);
  const tot = pl.total;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const row = (label, vals, opt) => {
    opt = opt || {};
    const cls = opt.strong ? 'hl-green' : '';
    let html = '<tr class="' + cls + '"><td>' + (opt.strong ? '<b>' + label + '</b>' : opt.sub ? '&nbsp;&nbsp;<span class="muted">' + label + '</span>' : label) + '</td>';
    vals.forEach(v => { html += plCell(v, opt.strong); });
    html += plCell(opt.total !== undefined ? opt.total : sum(vals), true) + '</tr>';
    return html;
  };
  const pctRow = (label, vals, total) => '<tr><td class="muted">' + label + '</td>' + vals.map(v => pctCell(v)).join('') + pctCell(total || 0) + '</tr>';

  const rev = ch.map(c => c.taxable);
  const commonAlloc = ch.map(c => c.commonShare);

  const mainTable =
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Particulars</th>' +
    CHANNELS.map(c => '<th class="right"><span class="dot ' + c.cls + '"></span> ' + c.label + '</th>').join('') +
    '<th class="right">TOTAL</th></tr></thead><tbody>' +
    row('Sales (GST sahit)', ch.map(c => c.sales)) +
    row('Less: GST collected', ch.map(c => -c.gst), { sub: true }) +
    row('Net Sales / Revenue', rev, { strong: true }) +
    row('Less: Material cost (COGS)', ch.map(c => -c.cogs), { sub: true }) +
    row('GROSS PROFIT', ch.map(c => c.gross), { strong: true }) +
    pctRow('Gross margin %', ch.map(c => c.grossMarginPct), tot.taxable ? tot.gross / tot.taxable * 100 : 0) +
    row('Less: Wastage / Damage', ch.map(c => -c.wastage), { sub: true }) +
    row('Less: Business kharche', ch.map(c => -c.expenses), { sub: true }) +
    row('CHANNEL PROFIT', ch.map(c => c.profit), { strong: true }) +
    row('Less: Common kharche (revenue share)', commonAlloc.map(v => -v), { sub: true }) +
    row('NET PROFIT', ch.map(c => c.profitAfterCommon), { strong: true }) +
    pctRow('Net margin %', ch.map(c => c.netMarginPct), tot.netMarginPct) +
    '</tbody><tfoot><tr><td><b>TOTAL (sab vertical)</b></td><td class="num" colspan="3"><b>Revenue ' + INR(rev.reduce((a, b) => a + b, 0)) + '</b></td>' +
    '<td class="num"><b class="' + (tot.net >= 0 ? 'pos' : 'neg') + '">' + money(tot.net) + '</b></td></tr></tfoot></table></div>';

  /* expense breakdown by category */
  const cats = {};
  CHANNELS.forEach(c => {
    Object.keys(pl.channels[c.id].expCats).forEach(k => {
      cats[k] = cats[k] || { bakery: 0, store: 0, supply: 0, common: 0 };
      cats[k][c.id] += pl.channels[c.id].expCats[k];
    });
  });
  Object.keys(pl.common.expCats).forEach(k => { cats[k] = cats[k] || { bakery: 0, store: 0, supply: 0, common: 0 }; cats[k].common += pl.common.expCats[k]; });
  const catKeys = Object.keys(cats).sort((a, b) => {
    const sa = cats[a].bakery + cats[a].store + cats[a].supply + cats[a].common;
    const sb = cats[b].bakery + cats[b].store + cats[b].supply + cats[b].common;
    return sb - sa;
  });
  const expTable = tableHTML([
    { label: 'Kharche ki category', render: r => '<b>' + esc(r.k) + '</b>' },
    { label: 'Bakery', cls: 'num', render: r => r.v.bakery ? INR0(r.v.bakery) : '—' },
    { label: 'Store', cls: 'num', render: r => r.v.store ? INR0(r.v.store) : '—' },
    { label: 'Supply', cls: 'num', render: r => r.v.supply ? INR0(r.v.supply) : '—' },
    { label: 'Common', cls: 'num', render: r => r.v.common ? INR0(r.v.common) : '—' },
    { label: 'Total', cls: 'num', render: r => '<b>' + INR0(r.v.bakery + r.v.store + r.v.supply + r.v.common) + '</b>' }
  ], catKeys.map(k => ({ k, v: cats[k] })), {
    compact: true, emptyTitle: 'Is period me koi kharcha nahi',
    foot: '<tr><td>Total</td><td class="num">' + INR0(ch[0].expenses) + '</td><td class="num">' + INR0(ch[1].expenses) + '</td><td class="num">' + INR0(ch[2].expenses) + '</td><td class="num">' + INR0(pl.common.expenses) + '</td><td class="num"><b>' + INR0(tot.expenses) + '</b></td></tr>'
  });

  /* comparison bars */
  const maxRev = Math.max.apply(null, rev.concat([1]));
  const bars = CHANNELS.map((c, i) => {
    const r = pl.channels[c.id];
    return '<div style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;font-size:12.6px"><span><span class="dot ' + c.cls + '"></span> <b>' + c.label + '</b></span>' +
      '<span>Rev ' + INR0(r.taxable) + ' · Profit <b class="' + (r.profitAfterCommon >= 0 ? 'pos' : 'neg') + '">' + INR0(r.profitAfterCommon) + '</b></span></div>' +
      '<div class="tracker" style="height:9px;margin-top:4px">' +
        '<i style="width:' + (r.cogs / maxRev * 100).toFixed(1) + '%;background:#f0a9a9" title="cost"></i>' +
        '<i style="width:' + (r.expenses / maxRev * 100).toFixed(1) + '%;background:#f3cf8e" title="kharche"></i>' +
        '<i style="width:' + (Math.max(0, r.profitAfterCommon) / maxRev * 100).toFixed(1) + '%;background:#7fd0a0" title="profit"></i>' +
      '</div>' +
      '<div class="tiny muted">Cost ' + INR0(r.cogs) + ' · Kharche ' + INR0(r.expenses + r.commonShare) + ' · Profit ' + INR0(r.profitAfterCommon) + ' (' + PCT(r.netMarginPct) + ')</div>' +
    '</div>';
  }).join('');

  return pageHead('Profit & Loss — Vertical wise', periodLabel() + ' · GST alag, revenue ex-GST me',
      '<button class="btn" data-act="nav" data-view="reportProduct">Product wise</button>' +
      '<button class="btn" data-act="printReport" data-title="Profit &amp; Loss Statement">🖨 Print</button>' +
      '<button class="btn" id="csvPnl">⬇ CSV</button>') +

    '<div class="kpis mb">' +
      tile('Revenue (ex-GST)', INR0(tot.taxable), '<span>' + tot.bills + ' bills</span>', 'navy') +
      tile('Gross Profit', INR0(tot.gross), '<span class="badge b-green">' + PCT(tot.taxable ? tot.gross / tot.taxable * 100 : 0) + '</span>', 'teal') +
      tile('Total Kharche', INR0(tot.expenses), '<span>Business + common</span>', 'amber') +
      tile('Net Profit', money(tot.net), '<span class="badge b-' + (tot.net >= 0 ? 'green' : 'red') + '">' + PCT(tot.netMarginPct) + ' net margin</span>', tot.net >= 0 ? 'green' : 'red') +
      tile('GST Payable', INR0(pl.total.gst), '<span>Output tax collected</span>', 'indigo') +
    '</div>' +

    card('Profit & Loss Statement', 'Tally style · teeno business alag column me', '', mainTable, { tight: true }) +

    '<div class="grid cols-2-1 mt">' +
      card('Kharche ki puri list', 'Vertical-wise breakup', '', expTable, { tight: true }) +
      card('Revenue vs Cost vs Profit', 'Bar jitni badi, raqam utni zyada', '', bars) +
    '</div>';
}

/* ---------------- PRODUCT P&L ---------------- */
function viewReportProduct() {
  const rows = productPL(P.from, P.to);
  const tot = rows.reduce((a, r) => ({
    qty: a.qty + r.qty, taxable: a.taxable + r.taxable, cogs: a.cogs + r.cogs, profit: a.profit + r.profit
  }), { qty: 0, taxable: 0, cogs: 0, profit: 0 });
  const maxP = Math.max.apply(null, rows.map(r => Math.abs(r.profit)).concat([1]));

  const body = tableHTML([
    { label: 'Product', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.category) + '</div>' },
    { label: 'Qty bika', cls: 'num', render: r => QTY(r.qty) },
    { label: 'Avg Rate', cls: 'num', render: r => INR(r.unitPrice) },
    { label: 'Revenue', cls: 'num', render: r => INR(r.taxable) },
    { label: 'Cost/pc', cls: 'num', render: r => INR(r.unitCost) },
    { label: 'Total Cost', cls: 'num', render: r => INR(r.cogs) },
    { label: 'Profit', cls: 'num', render: r => '<b class="' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + INR(r.profit) + '</b>' },
    { label: 'Margin', cls: 'num', render: r => '<span class="badge b-' + (r.marginPct >= 25 ? 'green' : r.marginPct >= 10 ? 'amber' : 'red') + '">' + PCT(r.marginPct) + '</span>' },
    { label: 'Share', render: r => '<div class="bar ' + (r.profit >= 0 ? 'g' : 'r') + '" style="width:90px"><i style="width:' + (Math.abs(r.profit) / maxP * 100).toFixed(1) + '%"></i></div>' },
    { label: 'Bakery / Store / Supply', cls: 'num', render: r => '<span class="tiny">' + INR0(r.bakery) + ' / ' + INR0(r.store) + ' / ' + INR0(r.supply) + '</span>' }
  ], rows, {
    compact: true, emptyTitle: 'Is period me sale nahi hui',
    foot: '<tr><td><b>Total</b></td><td class="num">' + QTY(tot.qty) + '</td><td></td><td class="num">' + INR(tot.taxable) + '</td><td></td><td class="num">' + INR(tot.cogs) + '</td><td class="num"><b class="' + (tot.profit >= 0 ? 'pos' : 'neg') + '">' + INR(tot.profit) + '</b></td><td class="num">' + PCT(tot.taxable ? tot.profit / tot.taxable * 100 : 0) + '</td><td></td><td></td></tr>'
  });

  return pageHead('Product wise P&L', periodLabel() + ' · kaunsa product paisa de raha hai, kaunsa kha raha hai',
      '<input class="btn" style="width:170px;cursor:text" placeholder="Search product" oninput="filterProdReport(this.value)">' +
      '<button class="btn" data-act="printReport" data-title="Product wise P&amp;L">🖨 Print</button>' +
      '<button class="btn" id="csvProd">⬇ CSV</button>') +
    '<div id="prodRepWrap">' + body + '</div>' +
    '<div class="mt">' + card('Padhne ka tarika', '', '',
      '<div class="grid cols-3">' +
        '<div><b class="pos">Green margin (25%+)</b><div class="tiny muted">Achha product — iski sale badhaiye, supply me bhi push karein.</div></div>' +
        '<div><b style="color:#b45309">Amber (10–25%)</b><div class="tiny muted">Theek hai — recipe me thoda cost kam karke margin sudhar sakte hain.</div></div>' +
        '<div><b class="neg">Red (&lt;10% ya loss)</b><div class="tiny muted">Rate badhaiye ya recipe review karein — ingredient rate change hua ho to.</div></div>' +
      '</div>') + '</div>';
}
function filterProdReport(q) {
  const wrap = $('#prodRepWrap');
  if (!wrap) return;
  const qq = String(q || '').toLowerCase();
  const rows = productPL(P.from, P.to).filter(r => !qq || r.name.toLowerCase().includes(qq));
  const maxP = Math.max.apply(null, rows.map(r => Math.abs(r.profit)).concat([1]));
  wrap.innerHTML = tableHTML([
    { label: 'Product', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.category) + '</div>' },
    { label: 'Qty bika', cls: 'num', render: r => QTY(r.qty) },
    { label: 'Avg Rate', cls: 'num', render: r => INR(r.unitPrice) },
    { label: 'Revenue', cls: 'num', render: r => INR(r.taxable) },
    { label: 'Cost/pc', cls: 'num', render: r => INR(r.unitCost) },
    { label: 'Total Cost', cls: 'num', render: r => INR(r.cogs) },
    { label: 'Profit', cls: 'num', render: r => '<b class="' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + INR(r.profit) + '</b>' },
    { label: 'Margin', cls: 'num', render: r => '<span class="badge b-' + (r.marginPct >= 25 ? 'green' : r.marginPct >= 10 ? 'amber' : 'red') + '">' + PCT(r.marginPct) + '</span>' },
    { label: 'Share', render: r => '<div class="bar ' + (r.profit >= 0 ? 'g' : 'r') + '" style="width:90px"><i style="width:' + (Math.abs(r.profit) / maxP * 100).toFixed(1) + '%"></i></div>' }
  ], rows, { compact: true, emptyTitle: 'Kuch nahi mila' });
}

/* ---------------- PARTY LEDGER ---------------- */
function viewReportParty() {
  const outs = buyers().map(p => {
    const b = partyBalance(p.id).receivable;
    const sales = DB.sales.filter(s => s.partyId === p.id).reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
    const paid = DB.payments.filter(x => x.partyId === p.id).reduce((a, x) => a + num(x.amount), 0);
    return { party: p, balance: b, sales, paid, overLimit: num(p.creditLimit) > 0 && b > num(p.creditLimit) };
  }).sort((a, b) => b.balance - a.balance);
  const totalRec = outs.reduce((a, o) => a + o.balance, 0);
  const vens = vendors().map(p => {
    const b = partyBalance(p.id).payable;
    const pur = DB.purchases.filter(x => x.partyId === p.id).reduce((a, x) => a + num(x.amount), 0);
    return { party: p, payable: b, purchase: pur };
  }).sort((a, b) => b.payable - a.payable);
  const totalPay = vens.reduce((a, v) => a + v.payable, 0);

  return pageHead('Party Ledger / Udhaar Khata', 'Customer se lena hai aur vendor ko dena hai — dono ka hisaab',
      '<button class="btn" data-act="nav" data-view="supplyPayments">Payment entry</button>' +
      '<button class="btn" data-act="printReport" data-title="Party Ledger / Udhaar">🖨 Print</button>' +
      '<button class="btn gold" data-act="newParty">+ Naya Party</button>') +

    '<div class="kpis mb">' +
      tile('Customers se Lena Hai', INR0(totalRec), '<span class="badge b-red">' + outs.filter(o => o.balance > 0).length + ' party</span>', 'red') +
      tile('Vendors ko Dena Hai', INR0(totalPay), '<span class="badge b-amber">' + vens.filter(v => v.payable > 0).length + ' vendor</span>', 'amber') +
      tile('Net Position', money(totalRec - totalPay), '<span>' + (totalRec - totalPay >= 0 ? 'Aapko milna hai' : 'Aapko dena hai') + '</span>', totalRec - totalPay >= 0 ? 'green' : 'red') +
    '</div>' +

    card('Outlets / Customers', 'Udhaar, receipt aur limit',
      '<span class="badge b-navy">' + outs.length + '</span>',
      tableHTML([
        { label: 'Party', render: r => '<b>' + esc(r.party.name) + '</b> <span class="badge b-grey">' + (r.party.type === 'customer' ? 'Customer' : 'Outlet') + '</span><div class="tiny muted">' + esc(r.party.area || '') + ' · ' + esc(r.party.phone || '') + '</div>' },
        { label: 'Total Sales', cls: 'num', render: r => INR0(r.sales) },
        { label: 'Received', cls: 'num', render: r => INR0(r.paid) },
        { label: 'Credit Days', cls: 'num', render: r => num(r.party.creditDays) + 'd' },
        { label: 'Baki (Dr)', cls: 'num', render: r => '<b class="' + (r.balance > 0 ? 'neg' : 'pos') + '">' + INR(r.balance) + '</b>' + (r.overLimit ? ' <span class="badge b-red">limit+</span>' : '') },
        { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="openLedger" data-id="' + r.party.id + '">Ledger</button>' +
            '<button class="btn sm" data-act="newPayment" data-party="' + r.party.id + '">₹</button>' +
            '<button class="btn sm" data-act="editParty" data-id="' + r.party.id + '">Edit</button></div>' }
      ], outs, { compact: true }), { tight: true }) +

    '<div class="mt">' + card('Vendors / Suppliers', 'Kharid aur payable',
      '<span class="badge b-navy">' + vens.length + '</span>',
      tableHTML([
        { label: 'Vendor', render: r => '<b>' + esc(r.party.name) + '</b><div class="tiny muted">' + esc(r.party.area || '') + '</div>' },
        { label: 'Total Purchase', cls: 'num', render: r => INR0(r.purchase) },
        { label: 'Dena Hai (Cr)', cls: 'num', render: r => '<b class="' + (r.payable > 0 ? 'neg' : 'pos') + '">' + INR(r.payable) + '</b>' },
        { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end"><button class="btn sm" data-act="openLedger" data-id="' + r.party.id + '">Ledger</button><button class="btn sm" data-act="editParty" data-id="' + r.party.id + '">Edit</button></div>' }
      ], vens, { compact: true }), { tight: true }) + '</div>' +
    (typeof loyaltyCard === 'function' ? '<div class="mt">' + loyaltyCard() + '</div>' : '');
}

function ledgerModal(partyId) {
  const p = partyById(partyId);
  const rows = partyLedgerRows(partyId);
  const bal = p.type === 'outlet' ? partyBalance(partyId).receivable : -partyBalance(partyId).payable;
  const body = tableHTML([
    { label: 'Date', render: r => dmy(r.date) },
    { label: 'Voucher', render: r => '<span class="badge b-grey">' + esc(r.type) + '</span>' },
    { label: 'Ref', render: r => '<span class="tiny mono">' + esc(r.ref) + '</span>' },
    { label: 'Particulars', render: r => esc(r.narration) },
    { label: 'Debit (lena)', cls: 'num', render: r => r.debit ? INR(r.debit) : '—' },
    { label: 'Credit (dena)', cls: 'num', render: r => r.credit ? INR(r.credit) : '—' },
    { label: 'Balance', cls: 'num', render: r => '<b>' + INR(r.balance) + '</b>' }
  ], rows, { compact: true, emptyTitle: 'Koi transaction nahi' });
  openModal({
    title: esc(p.name) + ' — Ledger', sub: (p.type === 'outlet' ? 'Customer' : 'Vendor') + ' · ' + esc(p.area || '') + ' · opening ' + INR(p.opening) + (num(p.points) > 0 ? ' · 🎁 ' + num(p.points) + ' points' : ''),
    width: 860, body: body + '<div class="calcbox"><div class="cr big"><span>' + (bal >= 0 ? 'Closing — aapko lena hai' : 'Closing — aapko dena hai') + '</span><span>' + INR(Math.abs(bal)) + '</span></div></div>',
    foot: (p.type === 'outlet' ? '<button class="btn primary" data-act="newPayment" data-party="' + p.id + '">Payment entry</button>' : '') +
      '<button class="btn" data-act="closeModal">Band karein</button>'
  });
}

/* ---------------- STOCK ---------------- */
function viewReportStock() {
  const rows = stockRows();
  const low = rows.filter(r => r.status !== 'ok');
  const totalVal = rows.reduce((a, r) => a + r.value, 0);
  const fg = finishedStock();
  const fgRows = DB.products.map(p => ({ p, qty: Math.max(0, fg[p.id] || 0), cost: productCost(p).perPc, value: Math.max(0, fg[p.id] || 0) * productCost(p).perPc }))
    .filter(r => r.qty > 0).sort((a, b) => b.value - a.value);
  const fgVal = fgRows.reduce((a, r) => a + r.value, 0);

  /* period consumption */
  const cons = {};
  DB.production.filter(pr => pr.date >= P.from && pr.date <= P.to).forEach(pr => {
    const p = productById(pr.productId);
    if (!p) return;
    (p.recipe.lines || []).forEach(l => cons[l.ingId] = (cons[l.ingId] || 0) + lineQty(l, p.recipe) * num(pr.batches));
  });

  return pageHead('Stock Summary', 'Raw material + finished goods · value aur low-stock alerts',
      '<button class="btn" data-act="printReport" data-title="Stock Summary">🖨 Print</button>' +
      '<button class="btn" data-act="nav" data-view="ingredients">Rate master</button>' +
      '<button class="btn gold" data-act="quickPurchase">+ Purchase</button>') +

    '<div class="kpis mb">' +
      tile('Raw Material Value', INR0(totalVal), '<span>' + rows.length + ' items</span>', 'navy') +
      tile('Finished Goods Value', INR0(fgVal), '<span>' + fgRows.length + ' products</span>', 'teal') +
      tile('Total Stock Value', INR0(totalVal + fgVal), '<span>Balance sheet item</span>', 'green') +
      tile('Low / Out of Stock', low.length, '<span class="badge b-' + (low.length ? 'red' : 'green') + '">' + (low.length ? 'order karein' : 'sab theek') + '</span>', low.length ? 'red' : 'green') +
    '</div>' +

    card('Raw Material Stock', 'Opening + purchase − production consumption',
      '<input class="btn" style="width:170px;cursor:text" placeholder="Search item" oninput="filterStockTable(this.value)">',
      '<div id="stockWrap">' + stockTableHTML(rows, cons) + '</div>', { tight: true }) +

    '<div class="mt">' + card('Finished Goods (taiyaar maal)', 'Production − sales', '',
      tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b>' },
        { label: 'Stock', cls: 'num', render: r => QTY(r.qty) + ' ' + esc(r.p.unit || 'pc') },
        { label: 'Cost / pc', cls: 'num', render: r => INR(r.cost) },
        { label: 'Value', cls: 'num', render: r => '<b>' + INR(r.value) + '</b>' },
        { label: 'Selling value', cls: 'num', render: r => INR(r.qty * priceOf(r.p)) }
      ], fgRows, { compact: true, emptyTitle: 'Finished stock khatam' }), { tight: true }) + '</div>';
}
function stockTableHTML(rows, cons) {
  return tableHTML([
    { label: 'Item', render: r => '<b>' + esc(r.ing.name) + '</b><div class="tiny muted">' + esc(r.ing.vendor || '') + ' · ' + esc(r.ing.group || '') + '</div>' },
    { label: 'Stock', cls: 'num', render: r => '<b class="' + (r.status === 'out' ? 'neg' : r.status === 'low' ? 'pos' : '') + '">' + QTY(r.stock) + '</b> <span class="tiny muted">' + esc(r.ing.unit) + '</span>' },
    { label: 'Min Level', cls: 'num', render: r => QTY(r.min) },
    { label: 'Rate', cls: 'num', render: r => INR(r.ing.rate) },
    { label: 'Value', cls: 'num', render: r => INR(r.value) },
    { label: 'Period use', cls: 'num', render: r => QTY(cons[r.ing.id] || 0) },
    { label: 'Status', cls: 'center', render: r => '<span class="badge b-' + (r.status === 'out' ? 'red' : r.status === 'low' ? 'amber' : 'green') + '">' + (r.status === 'out' ? 'Khatam' : r.status === 'low' ? 'Kam' : 'Theek') + '</span>' },
    { label: '', render: r => '<button class="btn sm" data-act="editIng" data-id="' + r.ing.id + '">Rate</button>' }
  ], rows, {
    compact: true,
    foot: '<tr><td><b>Total</b></td><td colspan="3"></td><td class="num"><b>' + INR(rows.reduce((a, r) => a + r.value, 0)) + '</b></td><td></td><td></td><td></td></tr>'
  });
}
function filterStockTable(q) {
  const wrap = $('#stockWrap');
  if (!wrap) return;
  const qq = String(q || '').toLowerCase();
  const cons = {};
  DB.production.forEach(pr => {
    const p = productById(pr.productId);
    if (!p) return;
    (p.recipe.lines || []).forEach(l => cons[l.ingId] = (cons[l.ingId] || 0) + lineQty(l, p.recipe) * num(pr.batches));
  });
  wrap.innerHTML = stockTableHTML(stockRows().filter(r => !qq || r.ing.name.toLowerCase().includes(qq)), cons);
}

/* ---------------- DAY BOOK ---------------- */
function viewReportDaybook() {
  const rows = dayBook(P.from, P.to);
  const dr = rows.filter(r => r.dir === 'Dr').reduce((a, r) => a + r.amount, 0);
  const cr = rows.filter(r => r.dir === 'Cr').reduce((a, r) => a + r.amount, 0);
  const count = {};
  rows.forEach(r => count[r.voucher] = (count[r.voucher] || 0) + 1);

  return pageHead('Day Book', periodLabel() + ' · saare vouchers ek jagah (Tally style)',
      '<button class="btn" data-act="printReport" data-title="Day Book">🖨 Print</button>' +
      '<button class="btn" id="csvDay">⬇ CSV</button>') +
    '<div class="kpis mb">' +
      tile('Total Entries', rows.length, '<span>' + Object.keys(count).map(k => k + ' ' + count[k]).join(' · ') + '</span>', 'navy') +
      tile('Debit Total', INR0(dr), '<span>Kharche, purchase, production</span>', 'red') +
      tile('Credit Total', INR0(cr), '<span>Sales, receipts</span>', 'green') +
    '</div>' +
    card('Vouchers', 'Naye sabse upar',
      '<input class="btn" style="width:160px;cursor:text" placeholder="Search" oninput="filterDaybook(this.value)">',
      '<div id="dayWrap">' + dayTableHTML(rows) + '</div>', { tight: true });
}
function dayTableHTML(rows) {
  return tableHTML([
    { label: 'Date', render: r => dmy(r.date) + '<div class="tiny muted">' + weekday(r.date) + '</div>' },
    { label: 'Voucher', render: r => '<span class="badge ' + r.vcls + '">' + r.voucher + '</span>' },
    { label: 'Particulars', render: r => esc(r.particulars) + (r.ref ? ' <span class="tiny mono muted">' + esc(r.ref) + '</span>' : '') },
    { label: 'Account', render: r => '<span class="tiny">' + esc(r.account) + '</span>' },
    { label: 'Debit', cls: 'num', render: r => r.dir === 'Dr' ? INR(r.amount) : '<span class="muted">—</span>' },
    { label: 'Credit', cls: 'num', render: r => r.dir === 'Cr' ? INR(r.amount) : '<span class="muted">—</span>' }
  ], rows.slice(0, 200), { compact: true, emptyTitle: 'Is period me koi entry nahi' });
}
function filterDaybook(q) {
  const wrap = $('#dayWrap');
  if (!wrap) return;
  const qq = String(q || '').toLowerCase();
  const rows = dayBook(P.from, P.to).filter(r => !qq ||
    (r.particulars + ' ' + r.account + ' ' + r.voucher).toLowerCase().includes(qq));
  wrap.innerHTML = dayTableHTML(rows);
}

/* ---------------- GST ---------------- */
function viewReportGst() {
  const g = gstSummary(P.from, P.to);
  const months = {};
  DB.sales.filter(s => s.date >= P.from && s.date <= P.to).forEach(s => {
    const k = monthKey(s.date);
    const amt = num(s.qty) * num(s.rate);
    const gg = num(s.gstPct);
    const m = months[k] || (months[k] = { taxable: 0, tax: 0 });
    m.taxable += amt / (1 + gg / 100);
    m.tax += amt - amt / (1 + gg / 100);
  });

  return pageHead('GST Summary', periodLabel() + ' · GST included pricing ka breakup',
      '<button class="btn" data-act="printReport" data-title="GST Summary">🖨 Print</button>' +
      '<button class="btn" id="csvGst">⬇ CSV</button>') +
    '<div class="kpis mb">' +
      tile('Taxable Value', INR0(g.output ? g.rows.reduce((a, r) => a + r.taxable, 0) : 0), '<span>' + g.rows.length + ' GST slabs</span>', 'navy') +
      tile('Output GST', INR0(g.output), '<span>Sales par GST</span>', 'amber') +
      tile('Input GST', INR0(g.input), '<span>Purchase par GST</span>', 'teal') +
      tile('Net GST Payable', INR0(g.net), '<span class="badge b-red">Sarkar ko dena hai</span>', 'red') +
    '</div>' +
    '<div class="grid cols-2">' +
      card('Slab wise breakup', 'Har GST rate ka alag hisaab', '',
        tableHTML([
          { label: 'GST Rate', render: r => '<b>' + r.rate + '%</b>' },
          { label: 'Taxable Value', cls: 'num', render: r => INR(r.taxable) },
          { label: 'CGST', cls: 'num', render: r => INR(r.tax / 2) },
          { label: 'SGST', cls: 'num', render: r => INR(r.tax / 2) },
          { label: 'Total Tax', cls: 'num', render: r => '<b>' + INR(r.tax) + '</b>' },
          { label: 'Gross (bill value)', cls: 'num', render: r => INR(r.gross) }
        ], g.rows, {
          compact: true, emptyTitle: 'Is period me sale nahi',
          foot: '<tr><td><b>Total</b></td><td class="num">' + INR(g.rows.reduce((a, r) => a + r.taxable, 0)) + '</td><td class="num">' + INR(g.output / 2) + '</td><td class="num">' + INR(g.output / 2) + '</td><td class="num"><b>' + INR(g.output) + '</b></td><td class="num">' + INR(g.rows.reduce((a, r) => a + r.gross, 0)) + '</td></tr>'
        }), { tight: true }) +
      card('Month wise GST', 'Filing ke liye idea', '',
        tableHTML([
          { label: 'Month', render: r => monthName(r.k) },
          { label: 'Taxable', cls: 'num', render: r => INR(r.v.taxable) },
          { label: 'GST', cls: 'num', render: r => '<b>' + INR(r.v.tax) + '</b>' }
        ], Object.keys(months).map(k => ({ k, v: months[k] })), { compact: true }), { tight: true }) +
    '</div>' +
    '<div class="mt">' + card('Dhyan dein', '', '',
      '<div class="alert"><span class="ic">ℹ️</span><div>Sale rates <b>GST-inclusive</b> hain (jaise bread ₹30 me 5% GST included). Report me taxable value alag karke dikhayi gayi hai.</div></div>' +
      '<div class="alert"><span class="ic">📄</span><div>Har supply bill me CGST/SGST ka breakup hota hai — "Supply / GST Bill" section se bill print kar sakte hain.</div></div>' +
      '<div class="alert"><span class="ic">⚠️</span><div>Ye GST summary estimate hai. Final filing CA se confirm karein.</div></div>') + '</div>';
}

/* ---------------- ingredients master ---------------- */
function viewIngredients() {
  const st = ingredientStock();
  const rows = DB.ingredients.slice().sort((a, b) => (a.group || '').localeCompare(b.group || '') || a.name.localeCompare(b.name));
  const totalVal = rows.reduce((a, i) => a + (st[i.id] || 0) * num(i.rate), 0);
  const usedIn = {};
  DB.products.forEach(p => (p.recipe && p.recipe.lines || []).forEach(l => {
    usedIn[l.ingId] = usedIn[l.ingId] || [];
    usedIn[l.ingId].push(p.name);
  }));

  return pageHead('Ingredients & Rate Master', 'Rate badalte hi sabhi products ka cost aur profit turant badal jata hai',
      '<button class="btn" id="csvIng">⬇ CSV</button>' +
      '<button class="btn gold" data-act="newIng">+ Naya Ingredient</button>') +
    '<div class="kpis mb">' +
      tile('Total Ingredients', rows.length, '<span>' + Object.keys(usedIn).length + ' products me use</span>', 'navy') +
      tile('Stock Value', INR0(totalVal), '<span>Current rate se</span>', 'teal') +
      tile('Low Stock', lowStockRows().length, '<span class="badge b-amber">order karein</span>', 'amber') +
    '</div>' +
    card('Rate Master', 'Rate field me formula bhi chalta hai — jaise 42*1.05',
      '<input class="btn" style="width:170px;cursor:text" placeholder="Search" oninput="filterIng(this.value)">',
      '<div id="ingWrap">' + ingTableHTML(rows, st, usedIn) + '</div>', { tight: true });
}
function ingTableHTML(rows, st, usedIn) {
  return tableHTML([
    { label: 'Ingredient', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.group || '') + '</div>' },
    { label: 'Unit', render: r => esc(r.unit) },
    { label: 'Rate ₹', cls: 'num', render: r => '<b>' + INR(r.rate) + '</b>' },
    { label: 'Stock', cls: 'num', render: r => { const q = st[r.id] || 0; return '<span class="' + (q < num(r.minStock) ? 'neg' : '') + '">' + QTY(q) + '</span>'; } },
    { label: 'Min', cls: 'num', render: r => QTY(r.minStock) },
    { label: 'Value', cls: 'num', render: r => INR((st[r.id] || 0) * num(r.rate)) },
    { label: 'Kis product me', render: r => '<span class="tiny">' + esc((usedIn[r.id] || []).slice(0, 3).join(', ')) + ((usedIn[r.id] || []).length > 3 ? ' +' + (usedIn[r.id].length - 3) : '') + '</span>' },
    { label: 'Vendor', render: r => '<span class="tiny">' + esc(r.vendor || '—') + '</span>' },
    { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end"><button class="btn sm" data-act="editIng" data-id="' + r.id + '">Edit</button><button class="btn sm danger" data-act="delIng" data-id="' + r.id + '">✕</button></div>' }
  ], rows, { compact: true });
}
function filterIng(q) {
  const wrap = $('#ingWrap');
  if (!wrap) return;
  const qq = String(q || '').toLowerCase();
  const st = ingredientStock();
  const usedIn = {};
  DB.products.forEach(p => (p.recipe && p.recipe.lines || []).forEach(l => { usedIn[l.ingId] = usedIn[l.ingId] || []; usedIn[l.ingId].push(p.name); }));
  wrap.innerHTML = ingTableHTML(DB.ingredients.filter(i => !qq || i.name.toLowerCase().includes(qq)), st, usedIn);
}

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  openLedger: d => ledgerModal(d.id),
  newParty: () => partyModal(null),
  editParty: d => partyModal(d.id),
  delParty: d => confirmBox('Party delete karein? Purani entries ledger me rahengi.', () => {
    DB.parties = DB.parties.filter(p => p.id !== d.id); saveDB(); render(); toast('Party delete', 'ok');
  }),
  newIng: () => ingModal(null),
  editIng: d => ingModal(d.id),
  delIng: d => confirmBox('Ingredient delete karein? Ye recipe se bhi hat jayega.', () => {
    DB.ingredients = DB.ingredients.filter(i => i.id !== d.id);
    DB.products.forEach(p => { if (p.recipe && p.recipe.lines) p.recipe.lines = p.recipe.lines.filter(l => l.ingId !== d.id); });
    saveDB(); render(); toast('Ingredient delete', 'ok');
  })
});
function partyModal(id) {
  const p = id ? partyById(id) : null;
  openForm({
    title: p ? 'Party edit' : 'Naya Party / Outlet', sub: 'Customer (outlet) ya Vendor — dono add kar sakte hain', width: 620,
    values: p || { type: 'outlet', creditDays: 15, creditLimit: 10000, opening: 0 },
    fields: [
      { key: 'name', label: 'Party ka naam', type: 'text', full: true },
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'outlet', label: 'Outlet / Distributor (supply)' }, { value: 'customer', label: 'Retail Customer (store udhaar)' }, { value: 'vendor', label: 'Vendor / Supplier' }] },
      { key: 'area', label: 'Area / Address', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'creditDays', label: 'Credit days', type: 'text' },
      { key: 'creditLimit', label: 'Udhaar limit ₹', type: 'text', hint: 'Limit cross hone par alert aayega' },
      { key: 'opening', label: 'Opening balance ₹', type: 'text', hint: 'Purana udhaar (lena hai to +)' }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.name.trim()) { toast('Naam daalein', 'err'); return false; }
      const rec = {
        id: p ? p.id : uid(d.type === 'vendor' ? 'v' : 'o'), name: d.name.trim(), type: d.type,
        area: d.area, phone: d.phone, creditDays: num(d.creditDays), creditLimit: num(d.creditLimit), opening: num(d.opening)
      };
      if (p) Object.assign(p, rec); else DB.parties.push(rec);
      saveDB(); toast('Party saved', 'ok');
    }
  });
}

function ingModal(id) {
  const ing = id ? ingById(id) : null;
  openForm({
    title: ing ? 'Ingredient edit' : 'Naya Ingredient', width: 620,
    values: ing || { unit: 'kg' },
    fields: [
      { key: 'name', label: 'Naam', type: 'text', full: true },
      { key: 'unit', label: 'Unit', type: 'select', options: ['kg', 'gram', 'litre', 'ml', 'pc', 'pack', 'box'] },
      { key: 'rate', label: 'Rate ₹ (formula chalta hai)', type: 'text', gold: true, hint: 'jaise 42 ya 42*1.05' },
      { key: 'opening', label: 'Opening stock', type: 'text' },
      { key: 'minStock', label: 'Minimum level (alert)', type: 'text' },
      { key: 'vendor', label: 'Vendor', type: 'select', options: [{ value: '', label: '— koi nahi —' }].concat(vendors().map(v => ({ value: v.name, label: v.name }))) },
      { key: 'group', label: 'Group', type: 'select', options: ['flour', 'fat', 'dairy', 'veg', 'pack', 'resale', 'inhouse', 'other'] }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.name.trim()) { toast('Naam daalein', 'err'); return false; }
      const rec = {
        id: ing ? ing.id : (d.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 12) + '_' + Math.floor(Math.random() * 900 + 100)),
        name: d.name.trim(), unit: d.unit, rate: num(d.rate), opening: num(d.opening), minStock: num(d.minStock),
        vendor: d.vendor, group: d.group
      };
      if (ing) Object.assign(ing, rec); else DB.ingredients.push(rec);
      saveDB(); toast('Ingredient saved', 'ok');
    }
  });
}
