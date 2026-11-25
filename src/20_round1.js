/* ================= ROUND 1: VENDOR PAYMENT · SALES RETURN · DISCOUNT · ROUND-OFF ================= */

/* ---------------------------- 1. VENDOR PAYMENT ---------------------------- */
function vendorPayable() {
  return vendors().map(v => {
    const b = partyBalance(v.id);
    const lastPay = (DB.vendorPayments || []).filter(x => x.partyId === v.id).map(x => x.date).sort().pop() || '';
    return { v: v, payable: b.payable, lastPay: lastPay };
  }).filter(r => r.payable > 0.5).sort((a, b) => b.payable - a.payable);
}

function viewVendorPay() {
  const rows = vendorPayable();
  const total = rows.reduce((a, r) => a + r.payable, 0);
  const pays = (DB.vendorPayments || []).filter(x => x.date >= P.from && x.date <= P.to).sort((a, b) => a.date < b.date ? 1 : -1);
  const paidPeriod = pays.reduce((a, x) => a + num(x.amount), 0);
  const cashPaid = pays.filter(x => x.mode === 'cash').reduce((a, x) => a + num(x.amount), 0);

  return pageHead('Vendor Payment', 'Vendor ko paisa dijiye — payable turant kam ho jayega',
      '<button class="btn" data-act="printReport" data-title="Vendor Payment">Print</button>' +
      '<button class="btn primary" data-act="newVendorPay">+ Payment karein</button>') +

    '<div class="kpis mb">' +
      tile('Total payable', INR0(total), '<span>' + rows.length + ' vendors</span>', total ? 'red' : 'green') +
      tile('Period me diya', INR0(paidPeriod), '<span>' + pays.length + ' payments</span>', 'green') +
      tile('Cash se diya', INR0(cashPaid), '<span>UPI ' + INR0(paidPeriod - cashPaid) + '</span>') +
      tile('Sabse bada', rows[0] ? esc(rows[0].v.name) : '—', '<span>' + (rows[0] ? INR0(rows[0].payable) : '—') + '</span>', 'amber') +
    '</div>' +

    '<div class="grid cols-2">' +
      card('Kisko dena hai', 'Payable wale vendor sabse upar', '<span class="badge b-grey">' + rows.length + '</span>',
        tableHTML([
          { label: 'Vendor', render: r => '<b>' + esc(r.v.name) + '</b><div class="tiny muted">' + esc(r.v.area || '') + (r.v.phone ? ' · ' + esc(r.v.phone) : '') + '</div>' },
          { label: 'Payable', cls: 'num', render: r => '<b class="neg">' + INR(r.payable) + '</b>' },
          { label: 'Last paid', render: r => r.lastPay ? dmy(r.lastPay) : '<span class="tiny muted">kabhi nahi</span>' },
          { label: '', render: r => '<button class="btn sm primary" data-act="payVendor" data-id="' + r.v.id + '" data-amt="' + r.payable + '">Pay</button>' }
        ], rows, { compact: true, emptyTitle: 'Kisi vendor ko dena nahi 🎉', empty: 'Sab payment clear hai.' }), { tight: true }) +
      card('Payments — ' + periodLabel(), 'Vendor ko diye gaye paise', '<span class="badge b-grey">' + pays.length + '</span>',
        tableHTML([
          { label: 'Date', render: r => dmy(r.date) },
          { label: 'Vendor', render: r => esc((partyById(r.partyId) || {}).name || '—') },
          { label: 'Amount', cls: 'num', render: r => '<b>' + INR(r.amount) + '</b>' },
          { label: 'Mode', render: r => payTag(r.mode) },
          { label: '', render: r => '<button class="btn sm danger" data-act="delVendorPay" data-id="' + r.id + '">✕</button>' }
        ], pays.slice(0, 60), { compact: true, emptyTitle: 'Is period me koi payment nahi' }), { tight: true }) +
    '</div>';
}

function vendorPayModal(vendorId, amount) {
  const list = vendors();
  if (!list.length) { toast('Pehle vendor add karein — Reports → Udhaar/Party', 'err'); current = 'reportParty'; render(); return; }
  const vid = vendorId || (vendorPayable()[0] || {}).v.id || list[0].id;
  openForm({
    title: 'Vendor ko Payment', sub: 'Paisa diya — payable kam, cash/bank se nikla', width: 560,
    values: { date: TODAY, partyId: vid, amount: amount ? String(r2(amount)) : String(partyBalance(vid).payable || ''), mode: 'cash' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'partyId', label: 'Vendor', type: 'select', options: list.map(v => ({ value: v.id, label: v.name + ' · payable ' + INR0(partyBalance(v.id).payable) })) },
      { key: 'amount', label: 'Amount ₹', type: 'text', gold: true, hint: 'Pura payable default aa jata hai' },
      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI / Bank' }] },
      { key: 'note', label: 'Note (optional)', type: 'text', full: true, placeholder: 'jaise: bill 45 ka payment' }
    ],
    submit: 'Payment save karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (!d.partyId || amt <= 0) { toast('Vendor aur amount sahi daalein', 'err'); return false; }
      if (!DB.vendorPayments) DB.vendorPayments = [];
      DB.vendorPayments.push({ id: uid('vp'), date: d.date || TODAY, partyId: d.partyId, amount: r2(amt), mode: d.mode, note: d.note || '' });
      saveDB(); toast('Vendor payment saved · ' + INR0(amt), 'ok');
    }
  });
}

/* ---------------------------- 2. SALES RETURN (negative sale) ---------------------------- */
function returnModal(opts) {
  opts = opts || {};
  if (!DB.products.length) { toast('Pehle product banayein', 'err'); current = 'bakeryProducts'; render(); return; }
  const parts = [].concat(outlets(), customers());
  openForm({
    title: 'Sales Return / Credit Note', sub: 'Customer maal wapas lauta de — stock badhega, udhaar kam hoga', width: 620,
    values: { date: TODAY, productId: (DB.products[0] || {}).id, qty: '', partyId: opts.partyId || '', mode: 'credit', reason: 'Damage' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'partyId', label: 'Party (udhaar wapas ke liye)', type: 'select', options: [{ value: '', label: '— Counter customer (cash wapas) —' }].concat(parts.map(p => ({ value: p.id, label: (p.type === 'customer' ? 'Customer · ' : 'Outlet · ') + p.name }))) },
      { key: 'productId', label: 'Product', type: 'select', options: DB.products.map(p => ({ value: p.id, label: p.name })) },
      { key: 'qty', label: 'Wapas aayi qty', type: 'text', gold: true },
      { key: 'rate', label: 'Rate ₹ (khaali = normal)', type: 'text' },
      { key: 'mode', label: 'Paisa kaise wapas?', type: 'select', options: [{ value: 'credit', label: 'Udhaar kam karein (party)' }, { value: 'cash', label: 'Cash wapas diya' }, { value: 'upi', label: 'UPI se wapas' }] },
      { key: 'reason', label: 'Reason', type: 'select', options: ['Damage', 'Expired', 'Galat maal', 'Order cancel', 'Other'] },
      { key: 'note', label: 'Note', type: 'text', full: true }
    ],
    submit: 'Return save karein',
    onSubmit: d => {
      const q = num(d.qty);
      if (q <= 0) { toast('Qty daalein', 'err'); return false; }
      const p = productById(d.productId);
      if (!p) { toast('Product chunein', 'err'); return false; }
      if (d.mode === 'credit' && !d.partyId) { toast('Udhaar kam karne ke liye party chunein', 'err'); return false; }
      const rate = num(d.rate) || partyRate(d.partyId, p, d.partyId && (partyById(d.partyId).type === 'outlet') ? 'supply' : 'store');
      const party = d.partyId ? partyById(d.partyId) : null;
      DB.sales.push({
        id: uid('sr'), date: d.date || TODAY,
        channel: party && party.type === 'outlet' ? 'supply' : 'store',
        productId: p.id, qty: -Math.abs(q), rate: rate, partyId: d.partyId || '',
        payMode: d.mode, discPct: 0, gstPct: num(p.gstPct), invNo: '',
        isReturn: 1, reason: d.reason, note: d.note || ''
      });
      DB.sales.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); toast('Return saved · ' + QTY(q) + ' ' + p.name + ' stock me wapas', 'ok');
    }
  });
}

/* ---------------------------- 3. DISCOUNT HELPERS ---------------------------- */
function lineNet(l) {
  const d = num(l.discPct) || 0;
  return num(l.qty) * num(l.rate) * (1 - d / 100);
}

/* ---------------------------- 4. ROUND-OFF ---------------------------- */
function roundOffOn() { return DB.settings && DB.settings.roundOff !== undefined ? !!num(DB.settings.roundOff) : true; }

/* bill lines ko round karke effective rate nikalta hai */
function applyBillRounding(lines, billDisc) {
  let total = lines.reduce((a, l) => a + lineNet(l), 0);
  const disc = Math.min(num(billDisc) || 0, total);
  if (disc > 0 && total > 0) {
    const f = (total - disc) / total;
    lines.forEach(l => { l.rate = num(l.rate) * f; });   /* full precision — revenue exact rahe */
    total = lines.reduce((a, l) => a + lineNet(l), 0);
  }
  const before = total;
  let rounded = false;
  if (roundOffOn() && total > 0) {
    const rTarget = Math.round(total);
    const diff = r2(rTarget - total);
    if (Math.abs(diff) >= 0.01) {
      const big = lines.slice().sort((a, b) => lineNet(b) - lineNet(a))[0];
      if (big && num(big.qty) > 0) {
        const d = num(big.discPct) || 0;
        big.rate = (lineNet(big) + diff) / (1 - d / 100) / num(big.qty);
        rounded = true;
      }
    }
  }
  return { total: r2(lines.reduce((a, l) => a + lineNet(l), 0)), discount: r2(disc), adjusted: rounded, before: r2(before) };
}

Object.assign(ACT, {
  newVendorPay: () => vendorPayModal(),
  payVendor: d => vendorPayModal(d.id, num(d.amt)),
  delVendorPay: d => confirmBox('Payment delete karein? Ledger bhi badal jayega.', () => {
    DB.vendorPayments = (DB.vendorPayments || []).filter(x => x.id !== d.id);
    saveDB(); render(); toast('Payment delete', 'ok');
  }),
  newReturn: d => returnModal({ partyId: d && d.party }),
  delReturn: d => confirmBox('Return entry delete karein?', () => {
    DB.sales = DB.sales.filter(s => s.id !== d.id);
    saveDB(); render(); toast('Return delete', 'ok');
  })
});
