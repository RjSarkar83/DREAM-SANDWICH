/* ================= BAHI KHATA — DOUBLE ENTRY LEDGER ================= */
/* Har transaction do side me post hota hai (Debit + Credit) — isliye trial balance hamesha match karta hai. */

let BK = { acc: 'cash' };
const EXP_ACC_ID = cat => 'exp_' + String(cat || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const GROUP_LABEL = { cash: 'Cash & Bank', debtor: 'Parties — aapko lena hai', agent: 'Agents — cash in hand', creditor: 'Vendors — aapko dena hai', income: 'Income (Sales)', expense: 'Expenses', gst: 'Tax', equity: 'Opening' };

function accountsList() {
  const list = [];
  list.push({ id: 'cash', name: 'Cash in Hand', group: 'cash', type: 'asset' });
  list.push({ id: 'bank', name: 'Bank / UPI', group: 'cash', type: 'asset' });
  buyers().forEach(p => list.push({ id: 'pt_' + p.id, name: p.name, group: 'debtor', type: 'asset', partyId: p.id, sub: p.area, ptype: p.type }));
  vendors().forEach(p => list.push({ id: 'pt_' + p.id, name: p.name, group: 'creditor', type: 'liability', partyId: p.id, sub: p.area }));
  agents().forEach(a => list.push({ id: 'ag_' + a.id, name: a.name, group: 'agent', type: 'asset', agentId: a.id, sub: a.area }));
  CHANNELS.forEach(c => list.push({ id: 'sales_' + c.id, name: 'Sales — ' + c.label, group: 'income', type: 'income' }));
  list.push({ id: 'purchase', name: 'Purchase (Raw Material)', group: 'expense', type: 'expense' });
  const cats = Array.from(new Set(DB.expenses.map(e => e.category))).sort();
  cats.forEach(c => list.push({ id: EXP_ACC_ID(c), name: c, group: 'expense', type: 'expense' }));
  list.push({ id: 'exp_bad_debt', name: 'Bad Debt / Write-off', group: 'expense', type: 'expense' });
  list.push({ id: 'gst', name: 'GST Payable', group: 'gst', type: 'liability' });
  list.push({ id: 'opening_eq', name: 'Opening Balance B/F', group: 'equity', type: 'equity' });
  return list;
}
const ACCMAP = () => { const m = {}; accountsList().forEach(a => m[a.id] = a); return m; };
const accName = (id, map) => (map && map[id] ? map[id].name : (ACCMAP()[id] || {}).name || id);

/* ---- opening balance (Dr = +, Cr = −) ---- */
function openingBalance(accId) {
  if (accId === 'cash') return num(DB.meta.openingCash);
  if (accId === 'bank') return num(DB.meta.openingBank);
  if (accId.indexOf('pt_') === 0) {
    const p = partyById(accId.slice(3));
    if (!p) return 0;
    return (p.type === 'outlet' || p.type === 'customer') ? num(p.opening) : -num(p.opening);
  }
  if (accId === 'opening_eq') {
    const t = DB.parties.reduce((a, p) => a + (p.type === 'vendor' ? -num(p.opening) : num(p.opening)), 0);
    return -(t + num(DB.meta.openingCash) + num(DB.meta.openingBank));
  }
  return 0;
}

/* ---- journal postings (double entry) ---- */
let _pc = { key: '', data: null };
function postingsAll() {
  const key = [DB.sales.length, DB.purchases.length, DB.expenses.length, DB.payments.length, DB.parties.length, DB.products.length,
    (DB.agentDeposits || []).length, (DB.agents || []).length, (DB.vendorPayments || []).length, (DB.writeOffs || []).length].join('|');
  if (_pc.key === key && _pc.data) return _pc.data;
  const data = buildPostings();
  _pc = { key: key, data: data };
  return data;
}
function buildPostings() {
  const out = [];
  const payAcc = m => (m === 'upi' ? 'bank' : 'cash');
  let n = 0;

  DB.sales.forEach(s => {
    const p = productById(s.productId);
    const party = s.partyId ? partyById(s.partyId) : null;
    const amt = r2(num(s.qty) * num(s.rate));
    const g = num(s.gstPct);
    const taxable = r2(amt / (1 + g / 100));
    const tax = r2(amt - taxable);
    const drAcc = (s.agentId && s.payMode === 'cash') ? 'ag_' + s.agentId
      : s.payMode === 'credit' ? (party ? 'pt_' + party.id : 'cash') : payAcc(s.payMode);
    out.push({
      date: s.date, voucher: 'Sale', ref: s.invNo || '', ord: n++,
      narration: (p ? p.name : '-') + ' · ' + QTY(s.qty) + ' × ' + INR(s.rate) + (party ? ' · ' + party.name : ''),
      lines: [{ acc: drAcc, dr: amt }, { acc: 'sales_' + s.channel, cr: taxable }, { acc: 'gst', cr: tax }]
    });
  });

  DB.purchases.forEach(pu => {
    const party = pu.partyId ? partyById(pu.partyId) : null;
    const total = r2(num(pu.amount)), paid = r2(num(pu.paidAmount));
    const lines = [{ acc: 'purchase', dr: total }];
    if (Math.abs(paid) > 0.005) lines.push(paid > 0 ? { acc: payAcc(pu.payMode), cr: paid } : { acc: payAcc(pu.payMode), dr: -paid });
    const unpaid = r2(total - paid);
    if (Math.abs(unpaid) > 0.005) lines.push(unpaid > 0 ? { acc: party ? 'pt_' + party.id : 'cash', cr: unpaid } : { acc: party ? 'pt_' + party.id : 'cash', dr: -unpaid });
    out.push({
      date: pu.date, voucher: 'Purchase', ref: '', ord: n++,
      narration: (pu.lines || []).map(l => (ingById(l.ingId) || {}).name + ' ' + QTY(l.qty)).join(', ') + (party ? ' · ' + party.name : ''),
      lines: lines
    });
  });

  DB.expenses.forEach(e => {
    out.push({
      date: e.date, voucher: 'Expense', ref: e.vertical ? VLABEL[e.vertical] : '', ord: n++,
      narration: e.category + (e.note ? ' · ' + e.note : ''),
      lines: [{ acc: EXP_ACC_ID(e.category), dr: r2(num(e.amount)) }, { acc: 'cash', cr: r2(num(e.amount)) }]
    });
  });

  (DB.writeOffs || []).forEach(w => {
    const p = partyById(w.partyId);
    out.push({
      date: w.date, voucher: 'Write-off', ref: '', ord: n++,
      narration: 'Bad debt · ' + (p ? p.name : '') + (w.note ? ' · ' + w.note : ''),
      lines: [{ acc: 'exp_bad_debt', dr: r2(num(w.amount)) }, { acc: p ? 'pt_' + p.id : 'cash', cr: r2(num(w.amount)) }]
    });
  });

  (DB.vendorPayments || []).forEach(v => {
    const p = partyById(v.partyId);
    out.push({
      date: v.date, voucher: 'Vendor Pay', ref: v.mode === 'upi' ? 'UPI' : 'Cash', ord: n++,
      narration: 'Vendor ko payment · ' + (p ? p.name : '') + (v.note ? ' · ' + v.note : ''),
      lines: [{ acc: p ? 'pt_' + p.id : 'cash', dr: r2(num(v.amount)) }, { acc: payAcc(v.mode), cr: r2(num(v.amount)) }]
    });
  });

  DB.payments.forEach(x => {
    const p = partyById(x.partyId);
    out.push({
      date: x.date, voucher: 'Receipt', ref: x.mode === 'upi' ? 'UPI' : 'Cash', ord: n++,
      narration: (p ? p.name : 'Party') + ' se payment' + (x.note ? ' · ' + x.note : ''),
      lines: [{ acc: payAcc(x.mode), dr: r2(num(x.amount)) }, { acc: p ? 'pt_' + p.id : 'cash', cr: r2(num(x.amount)) }]
    });
  });

  (DB.agentDeposits || []).forEach(dp => {
    const a = (DB.agents || []).find(x => x.id === dp.agentId);
    out.push({
      date: dp.date, voucher: 'Deposit', ref: dp.mode === 'upi' ? 'UPI' : 'Cash', ord: n++,
      narration: (a ? a.name : 'Agent') + ' ne cash jama kiya' + (dp.note ? ' · ' + dp.note : ''),
      lines: [{ acc: payAcc(dp.mode), dr: r2(num(dp.amount)) }, { acc: a ? 'ag_' + a.id : 'cash', cr: r2(num(dp.amount)) }]
    });
  });

  return out.sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : a.ord - b.ord));
}

/* ---- ek account ka pura ledger (opening + rows + closing) ---- */
function accountLedger(accId) {
  const map = ACCMAP();
  const opening = openingBalance(accId);
  let bal = opening;
  const rows = [];
  postingsAll().forEach(po => {
    po.lines.forEach((l, i) => {
      if (l.acc !== accId) return;
      const dr = num(l.dr), cr = num(l.cr);
      if (!dr && !cr) return;
      bal += dr - cr;
      const contra = po.lines.filter((x, j) => j !== i && !(x.acc === 'gst' && !num(x.cr)))
        .map(x => accName(x.acc, map)).join(' + ');
      rows.push({ date: po.date, voucher: po.voucher, ref: po.ref, contra: contra, narration: po.narration, dr: dr, cr: cr, bal: r2(bal) });
    });
  });
  return { opening: opening, rows: rows, closing: r2(bal), totalDr: r2(rows.reduce((a, r) => a + r.dr, 0)), totalCr: r2(rows.reduce((a, r) => a + r.cr, 0)) };
}

/* ---- as-on balance sab accounts ka ---- */
function balancesAsOn(asOn) {
  const map = {};
  accountsList().forEach(a => map[a.id] = openingBalance(a.id));
  postingsAll().forEach(po => {
    if (asOn && po.date > asOn) return;
    po.lines.forEach(l => { map[l.acc] = (map[l.acc] || 0) + num(l.dr) - num(l.cr); });
  });
  return map;
}

const drCr = (v, withWord) => {
  const n = r2(v);
  const w = withWord ? '<span class="drcr-tag">' + (n >= 0 ? 'Dr' : 'Cr') + '</span>' : '';
  return (n < 0 ? '-' : '') + INR(Math.abs(n)) + w;
};

/* ================= VIEW: BAHI KHATA ================= */
function viewBahiKhata() {
  const accs = accountsList();
  if (!accs.find(a => a.id === BK.acc)) BK.acc = 'cash';
  const acc = accs.find(a => a.id === BK.acc);
  const balMap = balancesAsOn(P.to);
  const lg = accountLedger(BK.acc);

  /* period ke hisaab se filter */
  const openingForPeriod = (function () {
    let o = lg.opening;
    lg.rows.forEach(r => { if (r.date < P.from) o = r.bal; });
    return o;
  })();
  const rows = lg.rows.filter(r => r.date >= P.from && r.date <= P.to);
  const totDr = rows.reduce((a, r) => a + r.dr, 0);
  const totCr = rows.reduce((a, r) => a + r.cr, 0);
  const closing = r2(openingForPeriod + totDr - totCr);

  const groups = ['cash', 'debtor', 'agent', 'creditor', 'income', 'expense', 'gst'];
  const listHTML = groups.map(g => {
    const items = accs.filter(a => a.group === g);
    if (!items.length) return '';
    return '<div class="bk-group">' + GROUP_LABEL[g] + '</div>' + items.map(a => {
      const b = r2(balMap[a.id] || 0);
      const show = Math.abs(b) > 0.004 || ['cash', 'bank'].indexOf(a.id) > -1;
      return '<button class="acct' + (a.id === BK.acc ? ' active' : '') + '" data-act="bkSelect" data-acc="' + a.id + '" data-name="' + esc(a.name).toLowerCase() + '">' +
        '<span class="acct-name">' + esc(a.name) + '</span>' +
        (show ? '<span class="acct-bal">' + INR0(Math.abs(b)) + ' ' + (b >= 0 ? 'Dr' : 'Cr') + '</span>' : '') +
        '</button>';
    }).join('');
  }).join('');

  const ledgerRows = rows.map(r =>
    '<tr><td>' + dmyShort(r.date) + '<div class="tiny muted">' + weekday(r.date) + '</div></td>' +
    '<td>' + esc(r.contra || '—') + '<div class="tiny muted">' + esc(r.narration) + '</div></td>' +
    '<td><span class="badge b-grey">' + esc(r.voucher) + '</span>' + (r.ref ? ' <span class="tiny mono muted">' + esc(r.ref) + '</span>' : '') + '</td>' +
    '<td class="drcr">' + (r.dr ? INR(r.dr) : '<span class="muted">—</span>') + '</td>' +
    '<td class="drcr">' + (r.cr ? INR(r.cr) : '<span class="muted">—</span>') + '</td>' +
    '<td class="drcr">' + drCr(r.bal, true) + '</td></tr>'
  ).join('');

  const ledgerCard =
    '<div class="card" id="ledgerCard">' +
      '<div class="ledger-head">' +
        '<div><h3>' + esc(acc.name) + '</h3>' +
          '<div class="sub">' + (GROUP_LABEL[acc.group] || '') + (acc.sub ? ' · ' + esc(acc.sub) : '') + ' · ' + periodLabel() + '</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          (acc.partyId && acc.group === 'debtor' ? '<button class="btn sm" data-act="newPayment" data-party="' + acc.partyId + '">Payment mila</button>' : '') +
          (acc.agentId ? '<button class="btn sm" data-act="agentDeposit" data-id="' + acc.agentId + '">Jama karein</button>' : '') +
          '<button class="btn sm" data-act="printLedger">Print</button>' +
        '</div>' +
      '</div>' +
      '<div class="ledger-sum">' +
        '<div><span>Opening</span><b>' + drCr(openingForPeriod, true) + '</b></div>' +
        '<div><span>Total Debit</span><b>' + INR(totDr) + '</b></div>' +
        '<div><span>Total Credit</span><b>' + INR(totCr) + '</b></div>' +
        '<div><span>Closing</span><b>' + drCr(closing, true) + '</b></div>' +
      '</div>' +
      '<div class="tbl-wrap" style="max-height:62vh">' +
        '<table class="ledger"><thead><tr>' +
          '<th style="width:90px">Date</th><th>Particulars</th><th style="width:120px">Voucher</th>' +
          '<th class="drcr" style="width:120px">Debit</th><th class="drcr" style="width:120px">Credit</th><th class="drcr" style="width:150px">Balance</th>' +
        '</tr></thead><tbody>' +
        '<tr class="opening"><td>' + dmy(P.from) + '</td><td>Opening Balance</td><td></td><td class="drcr">—</td><td class="drcr">—</td><td class="drcr">' + drCr(openingForPeriod, true) + '</td></tr>' +
        (rows.length ? ledgerRows : '<tr><td colspan="6" class="center muted" style="padding:26px">Is period me koi entry nahi</td></tr>') +
        '<tr class="closing"><td>' + dmy(P.to) + '</td><td>Closing Balance</td><td></td>' +
          '<td class="drcr">' + INR(totDr) + '</td><td class="drcr">' + INR(totCr) + '</td><td class="drcr">' + drCr(closing, true) + '</td></tr>' +
        '</tbody></table>' +
      '</div>' +
    '</div>';

  const note = acc.group === 'debtor'
    ? 'Ye party aapse maal le rahi hai — <b>Dr balance</b> matlab unhe dena hai (aapko lena hai).'
    : acc.group === 'creditor' ? 'Ye vendor hai — <b>Cr balance</b> matlab aapko unko dena hai.'
      : acc.group === 'income' ? 'Sales account — hamesha <b>Cr</b> me banta hai.' : '';

  return pageHead('Bahi Khata', 'Har entry do khaate me — Debit aur Credit · ' + periodLabel(),
      '<button class="btn" data-act="nav" data-view="trialBalance">Trial Balance</button>' +
      '<button class="btn primary" data-act="quickExpense">+ Kharcha</button>') +
    '<div class="bk">' +
      '<div class="bk-list">' +
        '<div class="bk-search"><input placeholder="Khaata dhundein…" oninput="bkFilter(this.value)"></div>' +
        '<div class="bk-scroll" id="bkList">' + listHTML + '</div>' +
      '</div>' +
      ledgerCard +
    '</div>' +
    (note ? '<div class="mt tiny muted">' + note + '</div>' : '');
}

function bkFilter(q) {
  const box = $('#bkList');
  if (!box) return;
  qq = String(q || '').toLowerCase();
  Array.prototype.forEach.call(box.querySelectorAll('.acct'), el => {
    const hay = el.dataset.name + ' ' + (el.querySelector('.acct-bal') ? '' : '');
    el.style.display = (!qq || hay.indexOf(qq) > -1) ? '' : 'none';
  });
  Array.prototype.forEach.call(box.querySelectorAll('.bk-group'), el => { el.style.display = qq ? 'none' : ''; });
}
let qq = '';

/* ================= VIEW: TRIAL BALANCE ================= */
function viewTrialBalance() {
  const map = balancesAsOn(P.to);
  const accs = accountsList().filter(a => Math.abs(map[a.id] || 0) > 0.004);
  const rows = accs.map(a => ({
    name: a.name, group: GROUP_LABEL[a.group] || a.group,
    dr: (map[a.id] || 0) > 0 ? r2(map[a.id]) : 0,
    cr: (map[a.id] || 0) < 0 ? r2(-map[a.id]) : 0
  })).sort((x, y) => x.group.localeCompare(y.group) || (y.dr + y.cr) - (x.dr + x.cr));
  const totDr = r2(rows.reduce((a, r) => a + r.dr, 0));
  const totCr = r2(rows.reduce((a, r) => a + r.cr, 0));
  const diff = Math.abs(totDr - totCr) < 0.05 ? 0 : r2(totDr - totCr);

  return pageHead('Trial Balance', 'Sab khaaton ka joda — as on ' + dmy(P.to),
      '<button class="btn" data-act="nav" data-view="bahiKhata">Bahi Khata</button>' +
      '<button class="btn" data-act="printReport" data-title="Trial Balance">Print</button>') +
    '<div class="kpis mb">' +
      tile('Total Debit', INR0(totDr), '<span>' + rows.filter(r => r.dr).length + ' accounts</span>', 'navy') +
      tile('Total Credit', INR0(totCr), '<span>' + rows.filter(r => r.cr).length + ' accounts</span>', 'navy') +
      tile('Difference', diff === 0 ? '₹0' : INR(diff), diff === 0 ? '<span class="badge b-green">Match ✓</span>' : '<span class="badge b-red">Galti hai</span>', diff === 0 ? 'green' : 'red') +
    '</div>' +
    card('Trial Balance', 'Debit = Credit hone chahiye', '',
      tableHTML([
        { label: 'Account', render: r => '<b>' + esc(r.name) + '</b>' },
        { label: 'Group', render: r => '<span class="badge b-grey">' + esc(r.group) + '</span>' },
        { label: 'Debit', cls: 'num', render: r => r.dr ? INR(r.dr) : '<span class="muted">—</span>' },
        { label: 'Credit', cls: 'num', render: r => r.cr ? INR(r.cr) : '<span class="muted">—</span>' }
      ], rows, {
        compact: true, emptyTitle: 'Koi entry nahi',
        foot: '<tr><td>Total</td><td></td><td class="num">' + INR(totDr) + '</td><td class="num">' + INR(totCr) + '</td></tr>'
      }), { tight: true }) +
    '<div class="mt">' + card('Kaise padhein', '', '',
      '<div class="grid cols-3">' +
        '<div><b>Assets / Kharche</b><div class="tiny muted">Debit balance — Cash, Bank, Parties (lena hai), Purchase, Expenses</div></div>' +
        '<div><b>Income / Liability</b><div class="tiny muted">Credit balance — Sales, GST Payable, Vendors (dena hai)</div></div>' +
        '<div><b>Match na ho to</b><div class="tiny muted">Kahin entry tooti hai — Day Book se check karein. App ki har entry auto double-entry hai, isliye normally ye kabhi nahi hota.</div></div>' +
      '</div>') + '</div>';
}

Object.assign(ACT, {
  bkSelect: d => { BK.acc = d.acc; render(); },
  printLedger: () => {
    const el = $('#ledgerCard');
    if (!el) return;
    const m = DB.meta;
    $('#printArea').innerHTML =
      '<div class="inv"><div class="ihead"><div><h1>' + esc(m.company) + '</h1>' +
        '<div style="font-size:11px;color:#444;line-height:1.6">' + esc(m.address || '') + '<br>GSTIN: ' + esc(m.gstin || '-') + '</div></div>' +
        '<div class="right"><div style="font-size:13px;font-weight:700">BAHI KHATA</div><div>' + periodLabel() + '</div></div></div></div>' +
      '<div style="margin-top:12px">' + el.outerHTML + '</div>';
    try { window.print(); } catch (e) { toast('Print block hai — browser me kholein', 'warn'); }
  }
});
