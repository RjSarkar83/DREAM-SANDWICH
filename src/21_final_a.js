/* ================= FINAL BATCH A: SETTLEMENT · PURCHASE RETURN · BAD DEBT · RECURRING · ING AGEING · AUDIT ================= */

/* ---------------------------- AUDIT LOG ---------------------------- */
function logAct(action, detail) {
  try {
    if (!DB.audit) DB.audit = [];
    DB.audit.unshift({ id: uid('au'), ts: new Date().toISOString().slice(0, 16).replace('T', ' '), role: (typeof SESSION !== 'undefined' && SESSION.role) || 'owner', action: action, detail: detail || '' });
    if (DB.audit.length > 300) DB.audit = DB.audit.slice(0, 300);
  } catch (e) {}
}

/* ---------------------------- 1. INVOICE WISE SETTLEMENT ---------------------------- */
function openInvoices(partyId) {
  const map = {};
  DB.sales.filter(s => s.partyId === partyId && s.payMode === 'credit').forEach(s => {
    const k = s.invNo || ('CNT-' + s.date);
    if (!map[k]) map[k] = { inv: k, date: s.date, amt: 0, paid: 0 };
    map[k].amt += num(s.qty) * num(s.rate);
    if (s.date < map[k].date) map[k].date = s.date;
  });
  const pays = (DB.payments || []).filter(p => p.partyId === partyId);
  pays.forEach(p => { if (p.invNo && map[p.invNo]) map[p.invNo].paid += num(p.amount); });
  const list = Object.values(map).filter(r => r.amt - r.paid > 0.5).sort((a, b) => a.date < b.date ? -1 : 1);
  return list;
}

function payInvModal(partyId, mode) {
  const list = openInvoices(partyId);
  if (!list.length) { toast('Koi open bill nahi', 'warn'); return; }
  openForm({
    title: 'Bill wise payment', sub: 'Kaunsa bill clear ho raha hai', width: 560,
    values: { date: TODAY, invNo: list[0].inv, amount: String(r2(list[0].amt - list[0].paid)), mode: mode || 'cash' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'invNo', label: 'Bill', type: 'select', options: list.map(r => ({ value: r.inv, label: r.inv + ' · ' + dmy(r.date) + ' · baki ' + INR0(r.amt - r.paid) })) },
      { key: 'amount', label: 'Amount ₹', type: 'text', gold: true },
      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI / Bank' }] }
    ],
    submit: 'Receipt save karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (amt <= 0) { toast('Amount daalein', 'err'); return false; }
      DB.payments.push({ id: uid('pay'), date: d.date || TODAY, partyId: partyId, amount: r2(amt), mode: d.mode, note: '', invNo: d.invNo });
      DB.payments.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); toast('Bill ' + d.invNo + ' ke against payment saved', 'ok');
    }
  });
}

/* invoice-wise ageing (fallback: pro-rata) */
function ageingRowsV2() {
  const out = [];
  DB.parties.filter(p => p.type !== 'vendor').forEach(p => {
    const invs = {};
    DB.sales.filter(s => s.partyId === p.id && s.payMode === 'credit').forEach(s => {
      const k = s.invNo || ('CNT-' + s.date);
      if (!invs[k]) invs[k] = { inv: k, date: s.date, amt: 0, paid: 0 };
      invs[k].amt += num(s.qty) * num(s.rate);
      if (s.date < invs[k].date) invs[k].date = s.date;
    });
    const list = Object.values(invs);
    /* direct bill payments */
    (DB.payments || []).filter(x => x.partyId === p.id && x.invNo && invs[x.invNo]).forEach(x => { invs[x.invNo].paid += num(x.amount); });
    /* baaki payments pro-rata (purana bill pehle) */
    const free = (DB.payments || []).filter(x => x.partyId === p.id && !x.invNo).reduce((a, x) => a + num(x.amount), 0);
    const dues = list.map(r => ({ r: r, left: Math.max(0, r.amt - r.paid) })).filter(o => o.left > 0.005).sort((a, b) => a.r.date < b.r.date ? -1 : 1);
    const totalDue = dues.reduce((a, o) => a + o.left, 0);
    const gross = list.reduce((a, r) => a + r.amt, 0) + Math.max(0, num(p.opening));
    const unallocLeft = Math.max(0, free - Math.max(0, gross - totalDue - Math.max(0, num(p.opening))));
    const freeRatio = totalDue > 0 ? Math.min(1, free / totalDue) : 0;
    void unallocLeft;
    const b = { d15: 0, d30: 0, d60: 0, d90: 0 };
    let oldest = '';
    dues.forEach(o => {
      const left = r2(o.left * (1 - freeRatio));
      if (left <= 0.005) return;
      const age = daysSince(o.r.date);
      if (age <= 15) b.d15 += left; else if (age <= 30) b.d30 += left; else if (age <= 60) b.d60 += left; else b.d90 += left;
      if (!oldest || o.r.date < oldest) oldest = o.r.date;
    });
    const openShare = totalDue + Math.max(0, num(p.opening)) > 0 ? (Math.max(0, num(p.opening)) * (1 - freeRatio)) : 0;
    if (openShare > 0.005) { b.d90 += openShare; if (!oldest) oldest = addDays(TODAY, -400); }
    const total = b.d15 + b.d30 + b.d60 + b.d90;
    if (total <= 0.5) return;
    out.push({
      p: p, total: r2(total), d15: r2(b.d15), d30: r2(b.d30), d60: r2(b.d60), d90: r2(b.d90),
      oldest: oldest, overLimit: num(p.creditLimit) > 0 && total > num(p.creditLimit),
      overdue: r2(b.d60 + b.d90), days: oldest ? daysSince(oldest) : 0,
      bills: dues.length
    });
  });
  return out.sort((a, b) => b.total - a.total);
}

/* ---------------------------- 2. PURCHASE RETURN ---------------------------- */
function purchaseReturnModal() {
  if (!DB.ingredients.length) { toast('Pehle ingredient add karein', 'err'); current = 'ingredients'; render(); return; }
  if (!vendors().length) { toast('Pehle vendor add karein', 'err'); current = 'reportParty'; render(); return; }
  openForm({
    title: 'Purchase Return', sub: 'Kharab / galat maal vendor ko wapas — stock aur payable kam', width: 620,
    values: { date: TODAY, partyId: vendors()[0].id, ingId: DB.ingredients[0].id, qty: '', mode: 'credit', reason: 'Damage' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'partyId', label: 'Vendor', type: 'select', options: vendors().map(v => ({ value: v.id, label: v.name })) },
      { key: 'ingId', label: 'Ingredient', type: 'select', options: DB.ingredients.map(i => ({ value: i.id, label: i.name + ' (' + i.unit + ')' })) },
      { key: 'qty', label: 'Wapas ki qty', type: 'text', gold: true },
      { key: 'rate', label: 'Rate ₹ (khaali = normal)', type: 'text' },
      { key: 'mode', label: 'Paisa', type: 'select', options: [{ value: 'credit', label: 'Vendor ke khaate se kam (credit)' }, { value: 'cash', label: 'Cash wapas mila' }, { value: 'upi', label: 'UPI se wapas' }] },
      { key: 'reason', label: 'Reason', type: 'select', options: ['Damage', 'Kharab quality', 'Galat maal', 'Order cancel', 'Other'] }
    ],
    submit: 'Return save karein',
    onSubmit: d => {
      const q = num(d.qty);
      const ing = ingById(d.ingId);
      if (q <= 0 || !ing) { toast('Qty aur ingredient sahi daalein', 'err'); return false; }
      const rate = num(d.rate) || num(ing.rate);
      const amt = r2(q * rate);
      DB.purchases.push({
        id: uid('pr'), date: d.date || TODAY, partyId: d.partyId,
        lines: [{ ingId: ing.id, qty: -Math.abs(q), rate: rate }],
        amount: -amt, paidAmount: d.mode === 'credit' ? 0 : -amt, payMode: d.mode, note: 'Return · ' + d.reason,
        isReturn: 1
      });
      DB.purchases.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); logAct('Purchase Return', ing.name + ' ' + q + ' @' + rate);
      toast('Purchase return saved · stock ' + QTY(q) + ' kam', 'ok');
    }
  });
}

/* ---------------------------- 3. BAD DEBT WRITE-OFF ---------------------------- */
function writeOffModal(partyId) {
  const list = buyers().map(p => ({ p: p, bal: partyBalance(p.id).receivable })).filter(r => r.bal > 0.5).sort((a, b) => b.bal - a.bal);
  if (!list.length) { toast('Koi udhaar baaki nahi', 'warn'); return; }
  openForm({
    title: 'Bad Debt / Write-off', sub: 'Jo paisa aayega nahi — khaata band karein', width: 560,
    values: { date: TODAY, partyId: partyId || list[0].p.id, amount: String(r2(partyId ? partyBalance(partyId).receivable : list[0].bal)) },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'partyId', label: 'Party', type: 'select', options: list.map(r => ({ value: r.p.id, label: r.p.name + ' · baki ' + INR0(r.bal) })) },
      { key: 'amount', label: 'Amount ₹', type: 'text', gold: true },
      { key: 'note', label: 'Kyun?', type: 'text', full: true, placeholder: 'jaise: dukaan band ho gayi' }
    ],
    submit: 'Write-off karein',
    onSubmit: d => {
      const amt = num(d.amount);
      if (amt <= 0) { toast('Amount daalein', 'err'); return false; }
      if (!DB.writeOffs) DB.writeOffs = [];
      DB.writeOffs.push({ id: uid('wo'), date: d.date || TODAY, partyId: d.partyId, amount: r2(amt), note: d.note || '' });
      saveDB(); logAct('Write-off', 'party ' + d.partyId + ' ₹' + amt);
      toast('Write-off saved · P&L me Bad Debt kharcha', 'ok');
    }
  });
}

/* ---------------------------- 4. RECURRING EXPENSES ---------------------------- */
function recurringList() { return DB.recurring || []; }

function autoPostRecurring() {
  const m = monthKey(TODAY);
  let made = 0;
  (DB.recurring || []).forEach(r => {
    if (!num(r.active)) return;
    if (r.lastPosted === m) return;
    if (Number(TODAY.slice(8, 10)) < Number(r.day || 1)) return;
    DB.expenses.push({ id: uid('ex'), date: TODAY, vertical: r.vertical || 'common', category: r.category, amount: r2(num(r.amount)), note: (r.label || 'Recurring') + ' (auto)' });
    r.lastPosted = m; made++;
  });
  if (made) { DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1); saveDB(); }
  return made;
}

function recurringModal(id) {
  const r = id ? (DB.recurring || []).find(x => x.id === id) : null;
  openForm({
    title: r ? 'Recurring kharcha edit' : 'Recurring kharcha', sub: 'Har mahine fix din par kharcha apne aap lag jayega', width: 560,
    values: r || { day: 5, vertical: 'common', category: 'Shop Rent', active: 1 },
    fields: [
      { key: 'label', label: 'Naam', type: 'text', placeholder: 'jaise: dukaan ka kiraya' },
      { key: 'category', label: 'Category', type: 'select', options: EXP_CATS },
      { key: 'vertical', label: 'Kis vertical ka', type: 'select', options: [{ value: 'bakery', label: 'Bakery' }, { value: 'store', label: 'Store' }, { value: 'supply', label: 'Supply' }, { value: 'common', label: 'Common' }] },
      { key: 'amount', label: 'Amount ₹', type: 'text', gold: true },
      { key: 'day', label: 'Mahine ka din (1-31)', type: 'text' },
      { key: 'active', label: 'Chalu hai', type: 'select', options: [{ value: 1, label: 'Haan' }, { value: 0, label: 'Nahi' }] }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.label.trim() || num(d.amount) <= 0) { toast('Naam aur amount daalein', 'err'); return false; }
      if (!DB.recurring) DB.recurring = [];
      const rec = { id: r ? r.id : uid('rc'), label: d.label.trim(), category: d.category, vertical: d.vertical, amount: r2(num(d.amount)), day: Math.min(31, Math.max(1, num(d.day) || 1)), active: num(d.active), lastPosted: r ? r.lastPosted : '' };
      if (r) Object.assign(r, rec); else DB.recurring.push(rec);
      saveDB(); toast('Recurring kharcha saved', 'ok');
    }
  });
}

/* ---------------------------- 5. INGREDIENT AGEING ---------------------------- */
function ingredientAgeing() {
  const st = ingredientStock();
  const out = [];
  DB.ingredients.forEach(i => {
    const qty = st[i.id] || 0;
    if (qty <= 0.001) return;
    const buys = [];
    DB.purchases.forEach(pu => (pu.lines || []).forEach(l => { if (l.ingId === i.id) buys.push({ date: pu.date, qty: num(l.qty) }); }));
    buys.sort((a, b) => a.date < b.date ? -1 : 1);
    let acc = 0, oldest = '';
    for (let k = buys.length - 1; k >= 0; k--) {
      acc += buys[k].qty;
      if (acc >= qty - 0.001) { oldest = buys[k].date; break; }
    }
    out.push({ ing: i, qty: r3(qty), value: r2(qty * num(i.rate)), oldest: oldest, age: oldest ? daysSince(oldest) : 0 });
  });
  return out.sort((a, b) => b.age - a.age);
}

function ingAgeingCard() {
  const rows = ingredientAgeing();
  const stale = rows.filter(r => r.age > 21);
  return card('Raw material — kitna purana pada hai', 'Purana maal pehle use karein (FIFO)', '<span class="badge ' + (stale.length ? 'b-amber' : 'b-grey') + '">' + stale.length + ' purane</span>',
    tableHTML([
      { label: 'Ingredient', render: r => '<b>' + esc(r.ing.name) + '</b><div class="tiny muted">' + esc(r.ing.vendor || '') + '</div>' },
      { label: 'Stock', cls: 'num', render: r => QTY(r.qty) + ' ' + esc(r.ing.unit) },
      { label: 'Sabse purana lot', render: r => r.oldest ? dmy(r.oldest) : '<span class="tiny muted">—</span>' },
      { label: 'Din', cls: 'num', render: r => '<span class="badge ' + (r.age > 30 ? 'b-red' : r.age > 21 ? 'b-amber' : 'b-green') + '">' + r.age + ' din</span>' },
      { label: 'Value', cls: 'num', render: r => INR(r.value) }
    ], rows.slice(0, 25), { compact: true, emptyTitle: 'Raw stock khaali hai' }), { tight: true });
}

/* ---------------------------- ACT ---------------------------- */
Object.assign(ACT, {
  payBill: d => payInvModal(d.id, d.mode),
  newPurchaseReturn: () => purchaseReturnModal(),
  newWriteOff: d => writeOffModal(d && d.id),
  newRecurring: () => recurringModal(null),
  editRecurring: d => recurringModal(d.id),
  delRecurring: d => confirmBox('Recurring kharcha hataayein?', () => {
    DB.recurring = (DB.recurring || []).filter(x => x.id !== d.id); saveDB(); render(); toast('Hata diya', 'ok');
  }),
  postRecurring: () => {
    const n = autoPostRecurring();
    render(); toast(n ? n + ' kharcha post ho gaya' : 'Abhi kuch post karne ko nahi', n ? 'ok' : 'warn');
  }
});
