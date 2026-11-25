/* ================= STORE: PURCHASE, STOCK & PAYMENTS ================= */

function viewPurchases() {
  const rows = DB.purchases.filter(p => p.date >= P.from && p.date <= P.to);
  const amount = rows.reduce((a, p) => a + num(p.amount), 0);
  const paid = rows.reduce((a, p) => a + num(p.paidAmount), 0);
  const stockVal = stockRows().reduce((a, r) => a + r.value, 0);
  const low = lowStockRows();
  const fg = finishedStock();
  const fgVal = DB.products.reduce((a, p) => a + Math.max(0, fg[p.id] || 0) * productCost(p).perPc, 0);

  return pageHead('Purchase & Stock', 'Raw material kharid, stock aur vendor payment — sab ek jagah',
      '<button class="btn" data-act="newPurchaseReturn">← Return</button>' +
      '<button class="btn" data-act="nav" data-view="reportStock">Full stock report</button>' +
      '<button class="btn gold" data-act="quickPurchase">+ Naya Purchase</button>') +

    '<div class="kpis mb">' +
      tile('Period Purchase', INR0(amount), '<span>' + rows.length + ' bills</span>', 'navy') +
      tile('Vendor ko Diya', INR0(paid), '<span class="badge b-' + (paid >= amount ? 'green' : 'amber') + '">' + PCT(amount ? paid / amount * 100 : 0) + ' paid</span>', 'green') +
      tile('Vendor ko Dena Hai', INR0(amount - paid), '<span>' + vendors().length + ' vendors</span>', 'red') +
      tile('Raw Stock Value', INR0(stockVal), '<span>' + DB.ingredients.length + ' items</span>', 'teal') +
      tile('Finished Stock', INR0(fgVal), '<span>Taiyaar maal ka cost</span>', 'amber') +
      tile('Low Stock Items', low.length, '<span class="badge b-' + (low.length ? 'amber' : 'green') + '">' + (low.length ? 'order karna hai' : 'sab theek') + '</span>', low.length ? 'red' : 'green') +
    '</div>' +

    '<div class="grid cols-2-1">' +
      card('Purchase Bills', 'Ingredient-wise kharid ka record',
        '<span class="badge b-navy">' + rows.length + '</span>',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Vendor', render: r => '<b>' + esc((partyById(r.partyId) || {}).name || '—') + '</b>' },
          { label: 'Items', render: r => (r.lines || []).map(l => '<span class="tag-inline">' + esc((ingById(l.ingId) || {}).name || '?') + ' ' + QTY(l.qty) + '</span>').join(' ') },
          { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.amount) + '</b>' },
          { label: 'Paid', cls: 'num', render: r => INR(r.paidAmount) },
          { label: 'Baki', cls: 'num', render: r => { const b = num(r.amount) - num(r.paidAmount); return b > 0 ? '<span class="neg">' + INR(b) + '</span>' : '<span class="muted">—</span>'; } },
          { label: '', render: r => '<button class="btn sm danger" data-act="delPurchase" data-id="' + r.id + '">✕</button>' }
        ], rows.slice(0, 60), { compact: true, emptyTitle: 'Is period me purchase nahi' }), { tight: true }) +
      card('Low Stock — turant order karein', 'Minimum level se niche', '',
        tableHTML([
          { label: 'Item', render: r => '<b>' + esc(r.ing.name) + '</b><div class="tiny muted">' + esc(r.ing.vendor || '') + '</div>' },
          { label: 'Stock', cls: 'num', render: r => '<span class="' + (r.status === 'out' ? 'neg' : '') + '">' + QTY(r.stock) + ' ' + esc(r.ing.unit) + '</span>' },
          { label: 'Min', cls: 'num', render: r => QTY(r.min) }
        ], low.slice(0, 12), { compact: true, emptyTitle: 'Sab stock theek hai 👍', empty: '' }), { tight: true }) +
    '</div>';
}

/* ---------------- PURCHASE ENTRY ---------------- */
let PU = null;
function purchaseModal(opts) {
  opts = opts || {};
  if (!DB.ingredients.length) {
    toast('Pehle ingredient add karein — Masters → Ingredients & Rate', 'err');
    current = 'ingredients'; render(); return;
  }
  const first = opts.ingId ? (ingById(opts.ingId) || DB.ingredients[0]) : DB.ingredients[0];
  const vend = vendors().find(v => v.name === first.vendor);
  PU = {
    date: TODAY, partyId: opts.partyId || (vend ? vend.id : ((vendors()[0] || {}).id || '')), payMode: 'cash', updateRate: 1,
    poId: opts.poId || '',
    lines: (opts.lines && opts.lines.length)
      ? opts.lines.map(l => ({ ingId: l.ingId, qty: String(r3(l.qty)), rate: l.rate }))
      : [{ ingId: first.id, qty: opts.qty ? String(r3(opts.qty)) : '10', rate: first.rate }]
  };
  drawPurchase();
}
function drawPurchase() {
  const lines = PU.lines.map((l, i) => {
    const ing = ingById(l.ingId) || { unit: '', rate: 0 };
    return '<div class="linegrid">' +
      '<div class="field"><select class="puIng" data-i="' + i + '">' + DB.ingredients.map(x =>
        '<option value="' + x.id + '"' + (x.id === l.ingId ? ' selected' : '') + '>' + esc(x.name) + ' (' + esc(x.unit) + ')</option>').join('') + '</select></div>' +
      '<div class="field"><input type="text" class="puQty" data-i="' + i + '" value="' + esc(l.qty) + '"></div>' +
      '<div class="field"><input type="text" class="puRate" data-i="' + i + '" value="' + esc(l.rate) + '"></div>' +
      '<div class="field"><input type="text" class="puAmt" data-i="' + i + '" value="' + r2(num(l.qty) * num(l.rate)) + '" readonly style="background:#f8fafc"></div>' +
      '<button class="x-btn" data-act="puDel" data-i="' + i + '">✕</button></div>';
  }).join('');

  openModal({
    title: 'Naya Purchase Bill', sub: 'Qty aur rate daalein — stock automatically badh jayega', width: 820,
    body:
      '<div class="fields">' +
        '<div class="field"><label>Date</label><input type="date" class="puF" data-k="date" value="' + esc(PU.date) + '"></div>' +
        '<div class="field"><label>Vendor</label><select class="puF" data-k="partyId"><option value="">— Cash purchase —</option>' +
          vendors().map(v => '<option value="' + v.id + '"' + (PU.partyId === v.id ? ' selected' : '') + '>' + esc(v.name) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Payment</label><select class="puF" data-k="payMode">' +
          '<option value="cash"' + (PU.payMode === 'cash' ? ' selected' : '') + '>Pura cash</option>' +
          '<option value="upi"' + (PU.payMode === 'upi' ? ' selected' : '') + '>UPI / Bank</option>' +
          '<option value="credit"' + (PU.payMode === 'credit' ? ' selected' : '') + '>Udhaar (vendor ko baad me)</option></select></div>' +
        '<div class="field"><label class="check"><input type="checkbox" class="puF" data-k="updateRate"' + (PU.updateRate ? ' checked' : '') + '> Master rate bhi update karein</label></div>' +
      '</div><div class="hr"></div>' +
      '<div class="lines-head"><div>Ingredient</div><div>Qty</div><div>Rate ₹</div><div>Amount</div><div></div></div>' +
      lines + '<button class="btn sm" data-act="puAdd" style="margin-top:6px">+ Item jodein</button>' +
      '<div id="puTotals"></div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="puSave">Purchase save karein</button>'
  });
  const read = () => {
    $$('#modalRoot .puF').forEach(el => PU[el.dataset.k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value);
    $$('#modalRoot .puIng').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].ingId = el.value; });
    $$('#modalRoot .puQty').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].qty = el.value; });
    $$('#modalRoot .puRate').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].rate = el.value; });
  };
  const totals = () => {
    const t = PU.lines.reduce((a, l) => a + num(l.qty) * num(l.rate), 0);
    $('#puTotals').innerHTML = '<div class="calcbox">' +
      '<div class="cr"><span>Total items</span><span>' + PU.lines.length + '</span></div>' +
      '<div class="cr big"><span>Bill total</span><span>' + INR(t) + '</span></div></div>';
  };
  $$('#modalRoot .puF').forEach(el => el.addEventListener('change', read));
  $$('#modalRoot .puIng').forEach(el => el.addEventListener('change', () => {
    const i = +el.dataset.i; const ing = ingById(el.value);
    if (ing && PU.lines[i]) { PU.lines[i].ingId = el.value; PU.lines[i].rate = ing.rate; }
    read(); drawPurchase();
  }));
  $$('#modalRoot .puQty, #modalRoot .puRate').forEach(el => el.addEventListener('input', () => {
    read();
    $$('#modalRoot .puAmt').forEach(a => { const i = +a.dataset.i; const l = PU.lines[i]; if (l) a.value = r2(num(l.qty) * num(l.rate)); });
    totals();
  }));
  totals();
  $('#puSave').onclick = () => {
    read();
    const valid = PU.lines.filter(l => l.ingId && num(l.qty) > 0);
    if (!valid.length) { toast('Kam se kam ek item daalein', 'err'); return; }
    const amount = valid.reduce((a, l) => a + num(l.qty) * num(l.rate), 0);
    DB.purchases.push({
      id: uid('pu'), date: PU.date || TODAY, partyId: PU.partyId,
      lines: valid.map(l => ({ ingId: l.ingId, qty: num(l.qty), rate: num(l.rate) })),
      amount: r2(amount), paidAmount: PU.payMode === 'credit' ? 0 : r2(amount),
      payMode: PU.payMode, note: '', poId: PU.poId || ''
    });
    if (PU.updateRate) valid.forEach(l => { const ing = ingById(l.ingId); if (ing) ing.rate = num(l.rate); });
    DB.purchases.sort((a, b) => a.date < b.date ? 1 : -1);
    saveDB(); closeModal(); render();
    toast('Purchase saved · ' + INR0(amount) + ' · stock update ho gaya', 'ok');
  };
}

/* ---------------- PAYMENTS / UDHAAR ---------------- */
function viewPayments() {
  const outs = outstandingList();
  const totalOut = outs.reduce((a, o) => a + o.balance, 0);
  const recv = DB.payments.filter(p => p.date >= P.from && p.date <= P.to);
  const recvAmt = recv.reduce((a, p) => a + num(p.amount), 0);
  const vendorPayable = vendors().reduce((a, v) => a + partyBalance(v.id).payable, 0);
  const supplyCredit = DB.sales.filter(s => s.channel === 'supply' && s.payMode === 'credit' && s.date >= P.from && s.date <= P.to)
    .reduce((a, s) => a + num(s.qty) * num(s.rate), 0);

  return pageHead('Payments & Udhaar Khata', 'Kis party se kitna lena / dena hai — Tally style hisaab',
      '<button class="btn" data-act="nav" data-view="reportParty">Party ledger</button>' +
      '<button class="btn gold" data-act="newPayment">+ Payment mila</button>') +

    '<div class="kpis mb">' +
      tile('Total Receivable', INR0(totalOut), '<span class="badge b-red">' + outs.length + ' party</span>', 'red') +
      tile('Period me Received', INR0(recvAmt), '<span>' + recv.length + ' receipts</span>', 'green') +
      tile('Period ka Udhaar Sale', INR0(supplyCredit), '<span>Supply bills on credit</span>', 'indigo') +
      tile('Vendor Payable', INR0(vendorPayable), '<span>' + vendors().length + ' vendors</span>', 'amber') +
    '</div>' +

    '<div class="mb">' + card('Agent / Delivery — cash collection', 'Agent ke haath me kitna cash hai', '',
      agentSummaryHTML(), { tight: true }) + '</div>' +
    '<div class="grid cols-2-1">' +
      card('Party-wise Outstanding', 'Outlet + retail customer, purana udhaar sabse upar',
        '<span class="badge b-navy">' + outs.length + '</span>',
        tableHTML([
          { label: 'Party', render: r => '<b>' + esc(r.party.name) + '</b><div class="tiny muted">' + esc(r.party.area || '') + '</div>' },
          { label: 'Credit Days', cls: 'num', render: r => num(r.party.creditDays) + ' d' },
          { label: 'Last Sale', cls: 'num', render: r => r.lastSale ? dmyShort(r.lastSale) : '—' },
          { label: 'Limit', cls: 'num', render: r => num(r.party.creditLimit) ? INR0(r.party.creditLimit) : '—' },
          { label: 'Baki', cls: 'num', render: r => '<b class="' + (r.overLimit ? 'neg' : '') + '">' + INR(r.balance) + '</b>' + (r.overLimit ? ' <span class="badge b-red">limit+</span>' : '') },
          { label: '', render: r => '<button class="btn sm" data-act="newPayment" data-party="' + r.party.id + '">Payment</button>' }
        ], outs, { compact: true, emptyTitle: 'Koi udhaar baki nahi 🎉' }), { tight: true }) +

      card('Receipts', periodLabel(), '',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Party', render: r => esc((partyById(r.partyId) || {}).name || '—') },
          { label: 'Mode', render: r => payTag(r.mode) },
          { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.amount) + '</b>' },
          { label: '', render: r => '<button class="btn sm danger" data-act="delPayment" data-id="' + r.id + '">✕</button>' }
        ], recv, { compact: true, emptyTitle: 'Is period me payment nahi aayi' }), { tight: true }) +
    '</div>';
}

function paymentModal(partyId) {
  const list = buyers();
  if (!list.length) { toast('Pehle party add karein — Reports → Udhaar/Party', 'err'); current = 'reportParty'; render(); return; }
  openForm({
    title: 'Payment Received', sub: 'Party se paisa mila — udhaar kam ho jayega', width: 560,
    fields: [
      { key: 'date', label: 'Date', type: 'date', value: TODAY },
      { key: 'partyId', label: 'Party', type: 'select', value: partyId || (list[0] || {}).id, options: list.map(p => ({ value: p.id, label: (p.type === 'customer' ? 'Customer · ' : 'Outlet · ') + p.name + (p.area ? ' · ' + p.area : '') })) },
      { key: 'amount', label: 'Amount ₹', type: 'text', value: partyId ? String(r2(partyBalance(partyId).receivable)) : '', gold: true, hint: 'Baki rakam default aa jati hai' },
      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI / Bank' }] },
      { key: 'note', label: 'Note', type: 'text', full: true, placeholder: 'jaise: pichhle hafte ka hisaab' }
    ],
    submit: 'Receipt save karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (!d.partyId || amt <= 0) { toast('Party aur amount sahi daalein', 'err'); return false; }
      DB.payments.push({ id: uid('pay'), date: d.date || TODAY, partyId: d.partyId, amount: r2(amt), mode: d.mode, note: d.note || '' });
      DB.payments.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB();
      toast('Payment saved · ' + INR0(amt), 'ok');
    }
  });
}

/* ---------------- EXPENSES ---------------- */
const EXP_CATS = ['Shop Rent', 'Rent / Godown', 'Electricity', 'Gas Cylinder', 'Staff Salary', 'Transport / Fuel', 'Packaging Material', 'Machine Maintenance', 'Mobile / Internet', 'Cleaning / Consumables', 'Misc / Repairs', 'Other'];

function viewExpenses() {
  const rows = DB.expenses.filter(e => e.date >= P.from && e.date <= P.to);
  const total = rows.reduce((a, e) => a + num(e.amount), 0);
  const byV = { bakery: 0, store: 0, supply: 0, common: 0 };
  const byCat = {};
  rows.forEach(e => { byV[e.vertical] = (byV[e.vertical] || 0) + num(e.amount); byCat[e.category] = (byCat[e.category] || 0) + num(e.amount); });
  const cats = Object.keys(byCat).map(k => ({ k, v: byCat[k] })).sort((a, b) => b.v - a.v);

  return pageHead('Kharche / Expenses', periodLabel() + ' · total ' + INR0(total),
      '<button class="btn" data-act="newRecurring">+ Recurring</button>' +
      '<button class="btn gold" data-act="quickExpense">+ Naya Kharcha</button>') +

    (typeof recurringList === 'function' && recurringList().length ? card('🔁 Recurring kharche', 'Fix din par apne aap expense ban jata hai (app khulte hi)',
      '<button class="btn sm" data-act="postRecurring">Abhi post karein</button>' +
      tableHTML([
        { label: 'Naam', render: r => '<b>' + esc(r.label) + '</b><div class="tiny muted">' + esc(r.category) + ' · ' + (VLABEL[r.vertical] || r.vertical) + '</div>' },
        { label: 'Amount', cls: 'num', render: r => INR(r.amount) },
        { label: 'Din', cls: 'num', render: r => num(r.day) },
        { label: 'Last', render: r => r.lastPosted ? monthName(r.lastPosted) : '<span class="tiny muted">—</span>' },
        { label: 'Status', cls: 'center', render: r => num(r.active) ? '<span class="badge b-green">chalu</span>' : '<span class="badge b-grey">band</span>' },
        { label: '', render: r => '<div style="display:flex;gap:4px;justify-content:flex-end"><button class="btn sm" data-act="editRecurring" data-id="' + r.id + '">Edit</button><button class="btn sm danger" data-act="delRecurring" data-id="' + r.id + '">✕</button></div>' }
      ], recurringList(), { compact: true }), { tight: true }) + '<div class="mb"></div>' : '') +

    '<div class="kpis mb">' +
      tile('Total Kharche', INR0(total), '<span>' + rows.length + ' entries</span>', 'red') +
      CHANNELS.map(c => tile(c.label, INR0(byV[c.id] || 0),
        '<span class="bar ' + (c.id === 'bakery' ? 'a' : '') + '" style="width:100%;margin-top:2px"><i style="width:' + (total ? (byV[c.id] || 0) / total * 100 : 0) + '%"></i></span>',
        c.id === 'bakery' ? 'amber' : c.id === 'store' ? 'teal' : 'indigo')).join('') +
      tile('Common', INR0(byV.common), '<span>Rent/share kharche</span>', 'navy') +
    '</div>' +

    '<div class="grid cols-1-2">' +
      card('Category wise', 'Sabse bada kharcha sabse upar', '',
        cats.map(r => '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>' + esc(r.k) + '</span><b>' + INR0(r.v) + '</b></div>' +
          '<div class="bar r" style="margin-top:3px"><i style="width:' + (cats[0].v ? r.v / cats[0].v * 100 : 0).toFixed(1) + '%"></i></div></div>').join('') ||
        '<div class="empty">Koi kharcha nahi</div>') +
      card('Expense Entries', 'Har kharche ka vertical bhi tag hota hai',
        '<span class="badge b-navy">' + rows.length + '</span>',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Vertical', render: r => '<span class="badge b-' + (r.vertical === 'bakery' ? 'amber' : r.vertical === 'store' ? 'teal' : r.vertical === 'supply' ? 'indigo' : 'grey') + '">' + (VLABEL[r.vertical] || r.vertical) + '</span>' },
          { label: 'Category', render: r => '<b>' + esc(r.category) + '</b>' + (r.note ? '<div class="tiny muted">' + esc(r.note) + '</div>' : '') },
          { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.amount) + '</b>' },
          { label: '', render: r => '<button class="btn sm danger" data-act="delExpense" data-id="' + r.id + '">✕</button>' }
        ], rows.slice(0, 80), { compact: true, emptyTitle: 'Is period me koi kharcha nahi' }), { tight: true }) +
    '</div>';
}

function expenseModal() {
  openForm({
    title: 'Naya Kharcha', sub: 'Kis business ka kharcha hai — wahi P&L me jayega', width: 600,
    fields: [
      { key: 'date', label: 'Date', type: 'date', value: TODAY },
      { key: 'vertical', label: 'Kis vertical ka?', type: 'select', options: [{ value: 'bakery', label: 'Bakery' }, { value: 'store', label: 'Store / Stall' }, { value: 'supply', label: 'Marketing Supply' }, { value: 'common', label: 'Common (sab me baant jayega)' }] },
      { key: 'category', label: 'Category', type: 'select', options: EXP_CATS },
      { key: 'amount', label: 'Amount ₹', type: 'text', gold: true },
      { key: 'note', label: 'Note', type: 'text', full: true, placeholder: 'jaise: gas cylinder 1' }
    ],
    submit: 'Kharcha save karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (amt <= 0) { toast('Amount daalein', 'err'); return false; }
      DB.expenses.push({ id: uid('ex'), date: d.date || TODAY, vertical: d.vertical, category: d.category, amount: r2(amt), note: d.note || '' });
      DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); toast('Kharcha saved ' + INR0(amt), 'ok');
    }
  });
}

/* ---------------- STAFF & SALARY ---------------- */
function viewStaff() {
  const monthly = DB.staff.reduce((a, s) => a + (s.payType === 'monthly' ? num(s.rate) : num(s.rate) * num(s.daysPresent)), 0);
  const byV = { bakery: 0, store: 0, supply: 0, common: 0 };
  DB.staff.forEach(s => { const m = s.payType === 'monthly' ? num(s.rate) : num(s.rate) * num(s.daysPresent); byV[s.vertical] = (byV[s.vertical] || 0) + m; });
  const salaryExpense = DB.expenses.filter(e => e.category === 'Staff Salary' && e.date >= startOfMonth(TODAY));

  return pageHead('Staff & Salary', 'Team ka kharcha har vertical ke P&L me alag se dikhta hai',
      '<button class="btn" data-act="genSalary">Salary entry banaye</button>' +
      '<button class="btn gold" data-act="newStaff">+ Naya Staff</button>') +

    '<div class="kpis mb">' +
      tile('Monthly Salary Bill', INR0(monthly), '<span>' + DB.staff.length + ' log</span>', 'navy') +
      CHANNELS.map(c => tile(c.label + ' Team', INR0(byV[c.id] || 0),
        '<span>' + DB.staff.filter(s => s.vertical === c.id).length + ' staff</span>',
        c.id === 'bakery' ? 'amber' : c.id === 'store' ? 'teal' : 'indigo')).join('') +
      tile('Is mahine entry hui?', salaryExpense.length ? 'Haan' : 'Nahi',
        '<span class="badge b-' + (salaryExpense.length ? 'green' : 'amber') + '">' + INR0(salaryExpense.reduce((a, e) => a + num(e.amount), 0)) + '</span>', salaryExpense.length ? 'green' : 'amber') +
    '</div>' +

    card('Staff Master', 'Payroll ka hisaab', '',
      tableHTML([
        { label: 'Name', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.role) + '</div>' },
        { label: 'Vertical', render: r => '<span class="badge b-' + (r.vertical === 'bakery' ? 'amber' : r.vertical === 'store' ? 'teal' : r.vertical === 'supply' ? 'indigo' : 'grey') + '">' + (VLABEL[r.vertical] || r.vertical) + '</span>' },
        { label: 'Type', render: r => r.payType === 'monthly' ? 'Monthly' : 'Daily' },
        { label: 'Rate', cls: 'num', render: r => INR(r.rate) + '<span class="tiny muted">/' + (r.payType === 'monthly' ? 'month' : 'day') + '</span>' },
        { label: 'Days', cls: 'num', render: r => r.payType === 'monthly' ? '—' : QTY(r.daysPresent) },
        { label: 'Monthly Cost', cls: 'num', render: r => '<b>' + INR(r.payType === 'monthly' ? num(r.rate) : num(r.rate) * num(r.daysPresent)) + '</b>' },
        { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end"><button class="btn sm" data-act="editStaff" data-id="' + r.id + '">Edit</button><button class="btn sm danger" data-act="delStaff" data-id="' + r.id + '">✕</button></div>' }
      ], DB.staff, { compact: true }), { tight: true });
}

function staffModal(id) {
  const s = id ? DB.staff.find(x => x.id === id) : null;
  openForm({
    title: s ? 'Staff edit' : 'Naya Staff', width: 580,
    values: s || { payType: 'monthly', vertical: 'bakery', daysPresent: 26 },
    fields: [
      { key: 'name', label: 'Naam', type: 'text' },
      { key: 'role', label: 'Kaam / Role', type: 'text', placeholder: 'Baker, Helper, Counter…' },
      { key: 'payType', label: 'Salary type', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'daily', label: 'Daily' }] },
      { key: 'rate', label: 'Rate ₹', type: 'text', gold: true },
      { key: 'daysPresent', label: 'Days (daily wale ke liye)', type: 'text' },
      { key: 'vertical', label: 'Kis vertical me', type: 'select', options: [{ value: 'bakery', label: 'Bakery' }, { value: 'store', label: 'Store / Stall' }, { value: 'supply', label: 'Marketing Supply' }, { value: 'common', label: 'Common' }] }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.name.trim()) { toast('Naam daalein', 'err'); return false; }
      const rec = { id: s ? s.id : uid('s'), name: d.name.trim(), role: d.role, payType: d.payType, rate: num(d.rate), daysPresent: num(d.daysPresent) || 26, vertical: d.vertical };
      if (s) Object.assign(s, rec); else DB.staff.push(rec);
      saveDB(); toast('Staff saved', 'ok');
    }
  });
}

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  puAdd: () => {
    const read = () => {
      $$('#modalRoot .puF').forEach(el => PU[el.dataset.k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value);
      $$('#modalRoot .puIng').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].ingId = el.value; });
      $$('#modalRoot .puQty').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].qty = el.value; });
      $$('#modalRoot .puRate').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].rate = el.value; });
    };
    read();
    const ing = DB.ingredients[0];
    PU.lines.push({ ingId: ing.id, qty: '1', rate: ing.rate });
    drawPurchase();
  },
  puDel: d => {
    $$('#modalRoot .puF').forEach(el => PU[el.dataset.k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value);
    $$('#modalRoot .puQty').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].qty = el.value; });
    $$('#modalRoot .puRate').forEach(el => { const i = +el.dataset.i; if (PU.lines[i]) PU.lines[i].rate = el.value; });
    PU.lines.splice(+d.i, 1);
    if (!PU.lines.length) PU.lines.push({ ingId: 'MAIDA', qty: '1', rate: 0 });
    drawPurchase();
  },
  delPurchase: d => confirmBox('Purchase bill delete karein? Stock adjust ho jayega.', () => {
    DB.purchases = DB.purchases.filter(p => p.id !== d.id); saveDB(); render(); toast('Purchase delete', 'ok');
  }),
  newPayment: d => paymentModal(d.party),
  delPayment: d => confirmBox('Receipt delete karein?', () => {
    DB.payments = DB.payments.filter(p => p.id !== d.id); saveDB(); render(); toast('Receipt delete', 'ok');
  }),
  delExpense: d => confirmBox('Kharcha delete karein?', () => {
    DB.expenses = DB.expenses.filter(e => e.id !== d.id); saveDB(); render(); toast('Kharcha delete', 'ok');
  }),
  newStaff: () => staffModal(null),
  editStaff: d => staffModal(d.id),
  delStaff: d => confirmBox('Staff delete karein?', () => {
    DB.staff = DB.staff.filter(s => s.id !== d.id); saveDB(); render(); toast('Staff delete', 'ok');
  }),
  genSalary: () => {
    const m = monthKey(TODAY);
    const exists = DB.expenses.filter(e => e.category === 'Staff Salary' && monthKey(e.date) === m);
    if (exists.length) { toast('Is mahine ki salary entry pehle se hai', 'warn'); return; }
    const byV = {};
    DB.staff.forEach(s => {
      const amt = s.payType === 'monthly' ? num(s.rate) : num(s.rate) * num(s.daysPresent);
      byV[s.vertical] = (byV[s.vertical] || 0) + amt;
    });
    Object.keys(byV).forEach(v => {
      DB.expenses.push({ id: uid('ex'), date: startOfMonth(TODAY), vertical: v, category: 'Staff Salary', amount: r2(byV[v]), note: monthName(TODAY) + ' salary' });
    });
    DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1);
    saveDB(); render();
    toast('Salary entries ban gayi: ' + INR0(Object.values(byV).reduce((a, b) => a + b, 0)), 'ok');
  }
});
