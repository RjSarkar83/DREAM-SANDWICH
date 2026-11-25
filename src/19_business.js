/* ================= CREDIT AGEING · TARGET vs ACTUAL · FY CLOSING ================= */

/* ---------------------------- 1. CREDIT AGEING ---------------------------- */
function ageingRows() {
  const out = [];
  DB.parties.filter(p => p.type !== 'vendor').forEach(p => {
    const credits = DB.sales.filter(s => s.partyId === p.id && s.payMode === 'credit')
      .map(s => ({ date: s.date, amt: num(s.qty) * num(s.rate), inv: s.invNo || '' }))
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    const paidTotal = (DB.payments || []).filter(x => x.partyId === p.id).reduce((a, x) => a + num(x.amount), 0);
    const openBal = Math.max(0, num(p.opening));
    const grossCredit = credits.reduce((a, c) => a + c.amt, 0) + openBal;
    const unpaid = Math.max(0, grossCredit - paidTotal);
    const ratio = grossCredit > 0 ? Math.min(1, unpaid / grossCredit) : 0;
    const b = { d15: 0, d30: 0, d60: 0, d90: 0 };
    let oldest = '';
    credits.forEach(c => {
      const left = c.amt * ratio;
      if (left <= 0.005) return;
      const age = daysSince(c.date);
      if (age <= 15) b.d15 += left; else if (age <= 30) b.d30 += left; else if (age <= 60) b.d60 += left; else b.d90 += left;
      if (!oldest || c.date < oldest) oldest = c.date;
    });
    if (openBal * ratio > 0.005) { b.d90 += openBal * ratio; if (!oldest) oldest = addDays(TODAY, -400); }
    const total = b.d15 + b.d30 + b.d60 + b.d90;
    if (total <= 0.5) return;
    out.push({
      p: p, total: r2(total), d15: r2(b.d15), d30: r2(b.d30), d60: r2(b.d60), d90: r2(b.d90),
      oldest: oldest, overLimit: num(p.creditLimit) > 0 && total > num(p.creditLimit),
      overdue: r2(b.d60 + b.d90), days: oldest ? daysSince(oldest) : 0
    });
  });
  return out.sort((a, b) => b.total - a.total);
}

function viewAgeing() {
  const rows = (typeof ageingRowsV2 === 'function') ? ageingRowsV2() : ageingRows();
  const t = rows.reduce((a, r) => ({ total: a.total + r.total, d15: a.d15 + r.d15, d30: a.d30 + r.d30, d60: a.d60 + r.d60, d90: a.d90 + r.d90, over: a.over + (r.overLimit ? 1 : 0) }), { total: 0, d15: 0, d30: 0, d60: 0, d90: 0, over: 0 });
  const overLimit = rows.filter(r => r.overLimit);

  return pageHead('Credit Ageing', 'Kis party ka udhaar kitne din purana — 15 / 30 / 60 / 90 din',
      '<button class="btn" data-act="newWriteOff">Write-off</button>' +
      '<button class="btn" data-act="printReport" data-title="Credit Ageing">Print</button>' +
      '<button class="btn" data-act="nav" data-view="reportReminders">Reminder bhejein</button>') +

    '<div class="kpis mb">' +
      tile('Total receivable', INR0(t.total), '<span>' + rows.length + ' parties</span>', 'red') +
      tile('0–15 din', INR0(t.d15), '<span>fresh</span>', 'green') +
      tile('16–30 din', INR0(t.d30), '<span>follow-up</span>') +
      tile('31–60 din', INR0(t.d60), '<span>reminder zaroori</span>', 'amber') +
      tile('60+ din', INR0(t.d90), '<span>risk — recovery karein</span>', 'red') +
      tile('Limit cross', t.over, '<span>' + (t.over ? 'naya udhaar band karein' : 'sab limit me') + '</span>', t.over ? 'red' : 'green') +
    '</div>' +

    (overLimit.length ? '<div class="card" style="margin-bottom:14px;border-left:3px solid #c02626"><div style="font-weight:800;font-size:13.5px">⚠️ ' +
      overLimit.length + ' parties ki udhaar limit cross ho gayi</div><div class="tiny muted">' +
      overLimit.map(r => esc(r.p.name) + ' (' + INR0(r.total) + ' / limit ' + INR0(r.p.creditLimit) + ')').join(' · ') + '</div></div>' : '') +

    card('Party wise ageing', 'Purana udhaar pehle — 60+ wale sabse upar dekhein', '<span class="badge b-grey">' + rows.length + '</span>',
      tableHTML([
        { label: 'Party', render: r => '<b>' + esc(r.p.name) + '</b><div class="tiny muted">' + esc(r.p.area || '') + (r.oldest ? ' · ' + r.days + ' din' : '') + '</div>' },
        { label: 'Total', cls: 'num', render: r => '<b>' + INR(r.total) + '</b>' },
        { label: '0–15', cls: 'num', render: r => r.d15 ? INR0(r.d15) : '—' },
        { label: '16–30', cls: 'num', render: r => r.d30 ? INR0(r.d30) : '—' },
        { label: '31–60', cls: 'num', render: r => r.d60 ? '<span style="color:#b45309">' + INR0(r.d60) + '</span>' : '—' },
        { label: '60+', cls: 'num', render: r => r.d90 ? '<b class="neg">' + INR0(r.d90) + '</b>' : '—' },
        { label: 'Limit', render: r => num(r.p.creditLimit) ? '<span class="badge ' + (r.overLimit ? 'b-red' : 'b-grey') + '">' + INR0(r.p.creditLimit) + '</span>' : '<span class="tiny muted">—</span>' },
        { label: '', render: r => '<div style="display:flex;gap:4px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="copyReminder" data-id="' + r.p.id + '">Copy</button>' +
            (String(r.p.phone || '').trim() ? '<a class="btn sm primary" href="' + waLink(r.p.phone, reminderText(r.p)) + '" target="_blank" rel="noopener">WA</a>' : '') +
            '<button class="btn sm" data-act="newPayment" data-party="' + r.p.id + '">Paid</button>' +
            (r.bills ? '<button class="btn sm" data-act="payBill" data-id="' + r.p.id + '">Bill-wise</button>' : '') + '</div>' }
      ], rows, {
        compact: true, emptyTitle: 'Koi udhaar baaki nahi 🎉',
        foot: rows.length ? '<tr><td><b>Total</b></td><td class="num"><b>' + INR(t.total) + '</b></td><td class="num">' + INR0(t.d15) + '</td><td class="num">' + INR0(t.d30) + '</td><td class="num">' + INR0(t.d60) + '</td><td class="num">' + INR0(t.d90) + '</td><td colspan="2"></td></tr>' : ''
      }), { tight: true });
}

/* ---------------------------- 2. TARGET vs ACTUAL ---------------------------- */
function targets() {
  const t = (DB.settings && DB.settings.targets) || {};
  return { sales: num(t.sales), profit: num(t.profit) };
}

function targetCard() {
  const tg = targets();
  if (!tg.sales && !tg.profit) {
    return '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<div><div style="font-weight:800;font-size:13.5px">🎯 Mahine ka target set karein</div>' +
      '<div class="tiny muted">Target lagaen to roz pata chalega — aage hain ya peeche.</div></div>' +
      '<button class="btn primary" data-act="targetModal">Target set karein</button></div></div>';
  }
  const mStart = startOfMonth(TODAY), mEnd = endOfMonth(TODAY);
  const pl = plFor(mStart, mEnd);
  const sales = pl.total.taxable, profit = pl.total.net;
  const dayOfMonth = daysBetween(mStart, TODAY) + 1;
  const daysInMonth = daysBetween(mStart, mEnd) + 1;
  const runRate = dayOfMonth ? sales / dayOfMonth : 0;
  const projSales = runRate * daysInMonth;
  const salesPct = tg.sales ? sales / tg.sales * 100 : 0;
  const profitPct = tg.profit ? Math.max(0, profit) / tg.profit * 100 : 0;
  const need = tg.sales ? Math.max(0, tg.sales - sales) : 0;
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

  return '<div class="card" style="margin-bottom:14px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
      '<div><div style="font-weight:800;font-size:13.5px">🎯 ' + monthName(monthKey(TODAY)) + ' ka target</div>' +
      '<div class="tiny muted">Day ' + dayOfMonth + ' / ' + daysInMonth + ' · roz average ' + INR0(runRate) + '</div></div>' +
      '<button class="btn sm" data-act="targetModal">Badlein</button></div>' +
    '<div class="grid cols-2" style="gap:14px">' +
      '<div><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>Sale</span><b>' + INR0(sales) + ' / ' + INR0(tg.sales) + '</b></div>' +
        '<div class="bar" style="margin-top:4px;height:8px"><i style="width:' + Math.min(100, salesPct).toFixed(1) + '%;background:' + (salesPct >= 100 ? '#15803d' : salesPct >= 60 ? '#111827' : '#c2872e') + '"></i></div>' +
        '<div class="tiny muted" style="margin-top:4px">' + PCT(salesPct) + ' ho gaya · projection ' + INR0(projSales) + ' · roz ' + INR0(need / daysLeft) + ' chahiye</div></div>' +
      '<div><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>Net profit</span><b>' + INR0(profit) + ' / ' + INR0(tg.profit) + '</b></div>' +
        '<div class="bar" style="margin-top:4px;height:8px"><i style="width:' + Math.min(100, profitPct).toFixed(1) + '%;background:' + (profitPct >= 100 ? '#15803d' : profitPct >= 60 ? '#111827' : '#c02626') + '"></i></div>' +
        '<div class="tiny muted" style="margin-top:4px">' + PCT(profitPct) + ' · ' + (need > 0 ? 'target ke liye ' + INR0(need / daysLeft) + '/din sale chahiye' : 'target cross 🎉') + '</div></div>' +
    '</div></div>';
}

function targetModal() {
  const tg = targets();
  openForm({
    title: 'Monthly Target', sub: 'Sale aur net profit ka target — dashboard pe progress dikhega', width: 520,
    values: { sales: tg.sales || '', profit: tg.profit || '' },
    fields: [
      { key: 'sales', label: 'Mahine ki Sale target ₹', type: 'text', gold: true },
      { key: 'profit', label: 'Net Profit target ₹', type: 'text' }
    ],
    submit: 'Target save karein',
    onSubmit: d => {
      if (!DB.settings) DB.settings = { gstOn: 1 };
      DB.settings.targets = { sales: r2(num(d.sales)), profit: r2(num(d.profit)) };
      saveDB(); toast('Target set ho gaya', 'ok');
    }
  });
}

/* ---------------------------- 3. FY CLOSING ---------------------------- */
function fyClosingSummary() {
  const cashLed = cashLedger('cash'), bankLed = cashLedger('upi');
  const cashClose = num(DB.meta.openingCash) + cashLed.reduce((a, e) => a + e.in - e.out, 0);
  const bankClose = num(DB.meta.openingBank) + bankLed.reduce((a, e) => a + e.in - e.out, 0);
  const recv = outstandingList().reduce((a, o) => a + Math.max(0, o.balance), 0);
  const pay = DB.parties.reduce((a, p) => a + Math.max(0, partyBalance(p.id).payable), 0);
  const st = ingredientStock(), fg = finishedStock();
  const stockVal = r2(DB.ingredients.reduce((a, i) => a + Math.max(0, st[i.id] || 0) * num(i.rate), 0) +
    DB.products.reduce((a, p) => a + Math.max(0, fg[p.id] || 0) * productCost(p).perPc, 0));
  return { cashClose: r2(cashClose), bankClose: r2(bankClose), recv: r2(recv), pay: r2(pay), stockVal: stockVal, st: st, fg: fg };
}

function fyCloseModal() {
  const s = fyClosingSummary();
  const nextFy = (DB.meta.fy || fyOf(TODAY)).split('-').map((x, i) => i === 0 ? String(Number(x) + 1) : String(Number(x) + 1)).join('-');
  openModal({
    title: 'Financial Year Closing', sub: 'Purana saal band karke naya saal shuru karein', width: 640,
    body:
      '<div class="calcbox">' +
        '<div class="cr"><span>Closing Cash</span><b>' + INR(s.cashClose) + '</b></div>' +
        '<div class="cr"><span>Closing Bank / UPI</span><b>' + INR(s.bankClose) + '</b></div>' +
        '<div class="cr"><span>Parties se lena hai</span><b>' + INR(s.recv) + '</b></div>' +
        '<div class="cr"><span>Vendors ko dena hai</span><b>' + INR(s.pay) + '</b></div>' +
        '<div class="cr"><span>Stock value (raw + finished)</span><b>' + INR(s.stockVal) + '</b></div>' +
      '</div>' +
      '<div style="margin-top:12px;font-size:12.5px;line-height:1.7">' +
        '<b>Kya hoga:</b>' +
        '<div>1. Purana data ka <b>archive backup</b> browser me save hoga (wapas restore kar sakte hain)</div>' +
        '<div>2. Sale / purchase / production / kharcha / udhaar entries <b>clear</b> ho jayengi</div>' +
        '<div>3. Cash, Bank, party balance aur <b>stock</b> naye saal me opening ke roop me chala jayega</div>' +
        '<div>4. Naya FY: <b>' + nextFy + '</b> · invoice prefix bhi naya</div>' +
      '</div>' +
      '<div style="margin-top:12px;border:1px dashed #dbe2ea;border-radius:9px;padding:10px;font-size:12px;color:#64748b">' +
        'Masters (ingredients, products, parties, staff, agents, rate list) safe rahenge.</div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" id="fyGo">FY close karein</button>'
  });
  $('#fyGo').onclick = () => {
    confirmBox('Pakka? Purana data archive hoga aur saare vouchers clear ho jayenge.', doFyClose, 'Haan, close karein');
  };
}

function doFyClose() {
  const s = fyClosingSummary();
  const fy = DB.meta.fy || fyOf(TODAY);
  try { LS.setItem('ds_arch_' + fy, JSON.stringify(DB)); } catch (e) {}
  const nextFy = String(Number(fy.split('-')[0]) + 1) + '-' + String(Number(fy.split('-')[0]) + 2).slice(-2);
  const startDate = addDays(TODAY, 1);
  const st = s.st, fg = s.fg;

  /* carry finished stock as opening production (ye raw material consume karega) */
  const newProd = [];
  DB.products.forEach(p => {
    const q = Math.max(0, fg[p.id] || 0);
    if (q > 0.001) newProd.push({
      id: uid('pr'), date: startDate, productId: p.id, qty: r3(q),
      batches: r3(q / Math.max(0.0001, productCost(p).yieldQty)),
      batchNo: 'OPEN-' + nextFy.slice(0, 4), expiry: addDays(startDate, num(p.shelfLife) || 3), note: 'FY opening stock'
    });
  });
  /* opening production jo raw material khayega — utna raw stock me wapas add karna hoga */
  const consumed = {};
  newProd.forEach(pr => {
    const p = productById(pr.productId);
    if (!p || p.costMode === 'purchase') return;
    (p.recipe && p.recipe.lines || []).forEach(l => {
      consumed[l.ingId] = (consumed[l.ingId] || 0) + lineQty(l, p.recipe) * num(pr.batches);
    });
  });
  const newAdj = [];
  DB.ingredients.forEach(i => {
    const q = Math.max(0, st[i.id] || 0) + (consumed[i.id] || 0);
    if (q > 0.001) newAdj.push({ id: uid('sa'), date: startDate, ingId: i.id, type: 'add', qty: r3(q), reason: 'FY opening', note: fy + ' closing carry' });
    i.opening = 0;   /* master ka purana opening ab stockAdj me carry ho gaya */
  });

  /* party opening = closing balance */
  DB.parties.forEach(p => {
    const b = partyBalance(p.id);
    p.opening = p.type === 'vendor' ? r2(Math.max(0, b.payable)) : r2(Math.max(0, b.receivable));
  });

  DB.sales = []; DB.purchases = []; DB.production = newProd; DB.expenses = []; DB.payments = [];
  DB.orders = []; DB.wastage = []; DB.stockAdj = newAdj; DB.agentDeposits = [];
  DB.attendance = []; DB.advances = []; DB.salaryPaid = []; DB.purchaseOrders = [];
  DB.meta.openingCash = s.cashClose; DB.meta.openingBank = s.bankClose;
  DB.meta.fy = nextFy; DB.meta.invoicePrefix = 'DS/' + nextFy.slice(2) + '/';
  if (!DB.settings) DB.settings = { gstOn: 1 };
  DB.settings.fyClosed = fy;
  DB.settings.lastBackup = TODAY;
  saveDB(); closeModal(); current = 'dashboard'; render();
  toast('FY ' + fy + ' close ho gaya · naya saal ' + nextFy + ' shuru', 'ok');
}

function archivedFYs() {
  const out = [];
  try {
    for (let i = 0; i < LS.length; i++) {
      const k = LS.key(i);
      if (k && k.indexOf('ds_arch_') === 0) out.push(k.replace('ds_arch_', ''));
    }
  } catch (e) {}
  return out.sort().reverse();
}

function restoreArchive(fy) {
  try {
    const raw = LS.getItem('ds_arch_' + fy);
    if (!raw) { toast('Archive nahi mila', 'err'); return; }
    confirmBox('FY ' + fy + ' ka archive restore karein? Abhi ka data badal jayega.', () => {
      DB = JSON.parse(raw);
      if (!DB.settings) DB.settings = { gstOn: 1 };
      saveDB(); closeModal(); render();
      toast('FY ' + fy + ' ka data restore ho gaya', 'ok');
    }, 'Restore');
  } catch (e) { toast('Restore fail', 'err'); }
}

Object.assign(ACT, {
  targetModal: () => targetModal(),
  fyClose: () => fyCloseModal(),
  restoreArch: d => restoreArchive(d.fy)
});
