/* ================= BACKUP REMINDER · THERMAL BILL · PURCHASE ORDERS ================= */

/* ---------------------------- 1. BACKUP + AUTO SNAPSHOT ---------------------------- */
const SNAP_PREFIX = 'ds_snap_';
const SNAP_LAST = 'ds_snap_last';

function dbHasData() { return (DB.sales.length + DB.products.length + DB.expenses.length) > 0; }

function backupAgeDays() {
  const lb = DB.settings && DB.settings.lastBackup;
  return lb ? daysSince(lb) : null;
}

function snapKeys() {
  const out = [];
  try {
    for (let i = 0; i < LS.length; i++) {
      const k = LS.key(i);
      if (k && k.indexOf(SNAP_PREFIX) === 0 && k !== SNAP_LAST) out.push(k);
    }
  } catch (e) { for (const k in LS) { if (k.indexOf(SNAP_PREFIX) === 0 && k !== SNAP_LAST) out.push(k); } }
  return out.sort().reverse();
}

function autoSnapshot(force) {
  try {
    if (!dbHasData()) return;
    const last = LS.getItem(SNAP_LAST);
    if (!force && last && daysSince(last) < 3) return;
    const json = JSON.stringify(DB);
    if (json.length > 3000000) return;
    LS.setItem(SNAP_PREFIX + TODAY, json);
    LS.setItem(SNAP_LAST, TODAY);
    const keys = snapKeys();
    keys.slice(3).forEach(k => { try { LS.removeItem(k); } catch (e) {} });
  } catch (e) {}
}

function restoreSnapshot(key) {
  try {
    const raw = LS.getItem(key);
    if (!raw) { toast('Snapshot nahi mila', 'err'); return; }
    confirmBox('Is snapshot se data restore karein? (' + key.replace(SNAP_PREFIX, '') + ') — abhi ka data badal jayega.', () => {
      const d = JSON.parse(raw);
      if (!d || !d.meta) { toast('Snapshot kharab hai', 'err'); return; }
      DB = d;
      if (!DB.settings) DB.settings = { gstOn: 1 };
      saveDB();
      toast('Snapshot restore ho gaya', 'ok');
      render();
    }, 'Restore karein');
  } catch (e) { toast('Restore fail: ' + e.message, 'err'); }
}

function backupShare() {
  const json = JSON.stringify(DB, null, 1);
  DB.settings.lastBackup = TODAY; saveDB();
  autoSnapshot(true);
  const fname = 'dream-sandwich-backup-' + TODAY + '.json';
  try {
    const file = new File([json], fname, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Dream Sandwich backup ' + TODAY }).catch(() => {});
      return;
    }
  } catch (e) {}
  if (json.length > 60000) { toast('File bada hai — download karke WhatsApp me bhejein', 'warn'); backupDownload(); return; }
  copyBox('Backup — WhatsApp me bhejein (file nahi, text)', json);
}

function backupBanner() {
  if (!dbHasData()) return '';
  const age = backupAgeDays();
  if (age !== null && age < 7) return '';
  if (DB.settings.snoozeBackup && daysSince(DB.settings.snoozeBackup) < 3) return '';
  const title = age === null ? 'Backup abhi tak nahi liya' : ('Backup ' + age + ' din se nahi liya');
  return '<div class="card" style="margin-bottom:14px;border-left:3px solid #c2872e">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<div><div style="font-weight:800;font-size:14px">⚠️ ' + title + '</div><div class="tiny muted">Browser data clear hone par sab chala jayega. Ek click me backup lein — file download + auto snapshot.</div></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="backupNow">⬇ Backup file</button>' +
        '<button class="btn" data-act="backupShare">📤 Share / WhatsApp</button>' +
        '<button class="btn" data-act="backupLater">Baad me</button>' +
      '</div></div></div>';
}

/* ---------------------------- 2. THERMAL BILL (58 / 80 mm) ---------------------------- */
function thermalHTML(invNo, w) {
  const lines = DB.sales.filter(s => s.invNo === invNo);
  if (!lines.length) return '';
  const party = partyById(lines[0].partyId);
  const m = DB.meta;
  let gross = 0, tax = 0;
  const rows = lines.map(s => {
    const p = productById(s.productId) || { name: '-', unit: 'pc' };
    const amt = num(s.qty) * num(s.rate);
    const g = num(s.gstPct);
    const taxable = amt / (1 + g / 100);
    gross += amt; tax += amt - taxable;
    return '<div class="tr"><div class="ti">' + esc(p.name) + '</div><div class="tq">' + QTY(s.qty) + '</div>' +
      '<div class="tr2">' + r2(num(s.rate)) + '</div><div class="ta">' + r2(amt) + '</div></div>';
  }).join('');
  const dt = new Date();
  return '<div class="thermal w' + w + '">' +
    '<div class="tc big">' + esc(m.company || 'Dream Sandwich') + '</div>' +
    '<div class="tc sm">' + esc(m.tagline || '') + '</div>' +
    '<div class="tc sm">' + esc(m.address || '') + '</div>' +
    '<div class="tc sm">' + esc(m.phone || '') + '</div>' +
    '<div class="tc sm">GSTIN: ' + esc(m.gstin || '-') + '</div>' +
    '<div class="tc" style="margin:3px 0">' + barcodeSVG(invNo, { height: 26, unit: 0.9 }) + '</div>' +
    '<div class="hr"></div>' +
    '<div class="row"><span>Bill</span><b>' + esc(invNo) + '</b></div>' +
    '<div class="row"><span>Date</span><b>' + dmy(lines[0].date) + '</b></div>' +
    '<div class="row"><span>Party</span><b>' + esc(party ? party.name : 'Counter') + '</b></div>' +
    '<div class="hr"></div>' +
    '<div class="tr th"><div class="ti">Item</div><div class="tq">Qty</div><div class="tr2">Rate</div><div class="ta">Amt</div></div>' +
    rows +
    '<div class="hr"></div>' +
    '<div class="row"><span>Taxable</span><span>' + r2(gross - tax) + '</span></div>' +
    '<div class="row"><span>CGST</span><span>' + r2(tax / 2) + '</span></div>' +
    '<div class="row"><span>SGST</span><span>' + r2(tax / 2) + '</span></div>' +
    '<div class="row big"><span>TOTAL</span><span>' + INR(gross) + '</span></div>' +
    '<div class="row"><span>Payment</span><span>' + (lines[0].payMode === 'credit' ? 'Udhaar' : lines[0].payMode === 'upi' ? 'UPI' : 'Cash') + '</span></div>' +
    (party && party.phone ? '<div class="row"><span>Mobile</span><span>' + esc(party.phone) + '</span></div>' : '') +
    '<div class="hr"></div>' +
    '<div class="tc sm">Dhanyavaad — dobara aayein 🙏</div>' +
    '<div class="tc sm">' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · Dream Sandwich</div>' +
    '</div>';
}

function printThermal(invNo, w) {
  if (!DB.sales.filter(s => s.invNo === invNo).length) { toast('Bill nahi mila', 'err'); return; }
  w = String(w || 58) === '80' ? '80' : '58';
  const st = document.createElement('style');
  st.id = 'thStyle';
  st.textContent =
    '@media print{@page{size:' + (w === '58' ? '58mm' : '80mm') + ' auto;margin:2mm!important}' +
    'html,body{width:auto!important;background:#fff!important}' +
    '#printArea .thermal{width:' + (w === '58' ? '54mm' : '76mm') + ';font-family:"Courier New",monospace;color:#000;font-size:11px;line-height:1.3;padding:0}}' +
    '.thermal{width:' + (w === '58' ? '54mm' : '76mm') + ';font-family:"Courier New",monospace;font-size:11px;line-height:1.35;border:1px dashed #ccc;padding:6px;margin:0 auto;background:#fff}' +
    '.thermal .tc{text-align:center}.thermal .big{font-size:14px;font-weight:700;letter-spacing:.05em}' +
    '.thermal .sm{font-size:9.5px}.thermal .hr{border-top:1px dashed #000;margin:4px 0}' +
    '.thermal .row{display:flex;justify-content:space-between;gap:6px}.thermal .row.big{font-size:13px;font-weight:700;border-top:1px solid #000;border-bottom:1px solid #000;margin:3px 0;padding:2px 0}' +
    '.thermal .tr{display:flex;gap:3px;margin:1px 0}.thermal .th{font-weight:700;border-bottom:1px dotted #000}' +
    '.thermal .ti{flex:1;overflow:hidden}.thermal .tq{width:34px;text-align:right}.thermal .tr2{width:40px;text-align:right}.thermal .ta{width:52px;text-align:right}';
  document.head.appendChild(st);
  $('#printArea').innerHTML = thermalHTML(invNo, w);
  try { window.print(); } catch (e) { toast('Print block hai', 'warn'); }
  setTimeout(() => { const s = $('#thStyle'); if (s) s.remove(); }, 800);
}

const thermalBtns = inv => '<button class="btn sm" data-act="printInv" data-inv="' + esc(inv) + '">A4</button>' +
  '<button class="btn sm" data-act="printThermal" data-inv="' + esc(inv) + '" data-w="58">58mm</button>' +
  '<button class="btn sm" data-act="printThermal" data-inv="' + esc(inv) + '" data-w="80">80mm</button>';

/* ---------------------------- 3. PURCHASE ORDER ---------------------------- */
function nextPONo() {
  const fy = DB.meta.fy || fyOf(TODAY);
  const list = (DB.purchaseOrders || []).filter(p => String(p.no || '').indexOf('PO/' + fy) === 0);
  return 'PO/' + fy + '/' + String(list.length + 1).padStart(4, '0');
}

function poCalc(po) {
  const recs = DB.purchases.filter(p => p.poId === po.id);
  let totalQty = 0, recvQty = 0, value = 0, recvVal = 0;
  (po.lines || []).forEach(l => {
    const q = num(l.qty), r = num(l.rate);
    const got = recs.reduce((a, p) => a + (p.lines || []).filter(x => x.ingId === l.ingId).reduce((b, x) => b + num(x.qty), 0), 0);
    l.received = r3(got);
    totalQty += q; value += q * r;
    recvQty += Math.min(got, q); recvVal += Math.min(got, q) * r;
  });
  const status = recvQty <= 0.0001 ? 'open' : (recvQty >= totalQty - 0.0001 ? 'complete' : 'partial');
  return { totalQty: r3(totalQty), recvQty: r3(recvQty), pending: r3(Math.max(0, totalQty - recvQty)), value: r2(value), recvVal: r2(recvVal), status: status, bills: recs.length };
}

function poBadge(st) {
  return st === 'complete' ? '<span class="badge b-green">Received</span>'
    : st === 'partial' ? '<span class="badge b-amber">Partial</span>'
    : '<span class="badge b-grey">Pending</span>';
}

function viewPurchaseOrders() {
  const list = (DB.purchaseOrders || []).slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const rows = list.map(po => ({ po: po, c: poCalc(po), v: partyById(po.vendorId) }));
  const open = rows.filter(r => r.c.status !== 'complete');
  const pendVal = open.reduce((a, r) => a + (r.c.value - r.c.recvVal), 0);
  const periodVal = rows.filter(r => r.po.date >= P.from && r.po.date <= P.to).reduce((a, r) => a + r.c.value, 0);

  return pageHead('Purchase Orders', 'Vendor ko order bhejein — maal aane par "Receive" se purchase bill banega',
      '<button class="btn" data-act="poFromNeeded">Kya chahiye se PO</button>' +
      '<button class="btn primary" data-act="newPO">+ Naya PO</button>') +

    '<div class="kpis mb">' +
      tile('Pending PO', open.length, '<span>' + rows.length + ' total</span>', open.length ? 'amber' : 'green') +
      tile('Pending value', INR0(pendVal), '<span>maal aana baki</span>') +
      tile('Period ke PO', INR0(periodVal), '<span>' + periodLabel() + '</span>') +
      tile('Received', rows.filter(r => r.c.status === 'complete').length, '<span>' + rows.filter(r => r.c.status === 'partial').length + ' partial</span>', 'green') +
    '</div>' +

    card('PO Book', 'Naya PO sabse upar · Receive karne par stock aur vendor payable apne aap', '<span class="badge b-grey">' + rows.length + '</span>',
      tableHTML([
        { label: 'PO No', render: r => '<b>' + esc(r.po.no) + '</b><div class="tiny muted">' + dmy(r.po.date) + '</div>' },
        { label: 'Vendor', render: r => esc(r.v ? r.v.name : '—') },
        { label: 'Items', render: r => (r.po.lines || []).map(l => '<span class="tag-inline">' + esc((ingById(l.ingId) || {}).name || '?') + ' ' + QTY(l.qty) + '</span>').join(' ') },
        { label: 'Value', cls: 'num', render: r => INR(r.c.value) },
        { label: 'Received', cls: 'num', render: r => '<b>' + QTY(r.c.recvQty) + '</b> <span class="tiny muted">/ ' + QTY(r.c.totalQty) + '</span>' },
        { label: 'Pending', cls: 'num', render: r => r.c.pending > 0 ? '<b class="neg">' + QTY(r.c.pending) + '</b>' : '—' },
        { label: 'Status', cls: 'center', render: r => poBadge(r.c.status) },
        { label: '', render: r => '<div style="display:flex;gap:4px;justify-content:flex-end">' +
            (r.c.status !== 'complete' ? '<button class="btn sm primary" data-act="poReceive" data-id="' + r.po.id + '">Receive</button>' : '') +
            '<button class="btn sm" data-act="printPO" data-id="' + r.po.id + '">PO</button>' +
            '<button class="btn sm danger" data-act="delPO" data-id="' + r.po.id + '">✕</button></div>' }
      ], rows, { compact: true, emptyTitle: 'Abhi koi purchase order nahi', empty: 'Vendor ko maal order karne ke liye "+ Naya PO" dabayein — ya "Kya Chahiye" se seedha PO banayein.' }), { tight: true });
}

/* PO editor */
let PO = null;
function poModal(opts) {
  opts = opts || {};
  if (!DB.ingredients.length) { toast('Pehle ingredient add karein', 'err'); current = 'ingredients'; render(); return; }
  if (!vendors().length) { toast('Pehle vendor party add karein', 'err'); current = 'reportParty'; render(); return; }
  PO = {
    date: TODAY, vendorId: opts.vendorId || vendors()[0].id, note: '',
    lines: (opts.lines && opts.lines.length) ? opts.lines.map(l => ({ ingId: l.ingId, qty: String(r3(l.qty)), rate: l.rate }))
      : [{ ingId: DB.ingredients[0].id, qty: '10', rate: DB.ingredients[0].rate }]
  };
  drawPO();
}

function drawPO() {
  const ingOpts = sel => DB.ingredients.map(i => '<option value="' + i.id + '"' + (i.id === sel ? ' selected' : '') + '>' + esc(i.name) + ' (' + esc(i.unit) + ')</option>').join('');
  const lines = PO.lines.map((l, i) => '<div class="linegrid">' +
    '<div class="field"><select class="poIng" data-i="' + i + '">' + ingOpts(l.ingId) + '</select></div>' +
    '<div class="field"><input type="text" class="poQty" data-i="' + i + '" value="' + esc(l.qty) + '"></div>' +
    '<div class="field"><input type="text" class="poRate" data-i="' + i + '" value="' + esc(l.rate) + '"></div>' +
    '<div class="field"><input type="text" class="poAmt" data-i="' + i + '" value="' + r2(num(l.qty) * num(l.rate)) + '" readonly style="background:#f8fafc"></div>' +
    '<button class="x-btn" data-act="poDel" data-i="' + i + '">✕</button></div>').join('');

  openModal({
    title: 'Naya Purchase Order', sub: 'Vendor ko order — maal aane par "Receive" se bill banega', width: 780,
    body:
      '<div class="fields">' +
        '<div class="field"><label>Date</label><input type="date" id="poDate" value="' + esc(PO.date) + '"></div>' +
        '<div class="field"><label>Vendor</label><select id="poVendor">' + vendors().map(v =>
          '<option value="' + v.id + '"' + (PO.vendorId === v.id ? ' selected' : '') + '>' + esc(v.name) + (v.area ? ' · ' + esc(v.area) : '') + '</option>').join('') + '</select></div>' +
        '<div class="field full"><label>Note (optional)</label><input id="poNote" value="' + esc(PO.note) + '" placeholder="jaise: kal subah tak maal chahiye"></div>' +
      '</div><div class="hr"></div>' +
      '<div class="lines-head"><div>Ingredient</div><div>Qty</div><div>Rate ₹</div><div>Amount</div><div></div></div>' +
      lines + '<button class="btn sm" data-act="poAdd" style="margin-top:6px">+ Item jodein</button>' +
      '<div class="calcbox" id="poTotals"></div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="poSave">PO save karein</button>'
  });

  const read = () => {
    PO.date = $('#poDate').value || TODAY;
    PO.vendorId = $('#poVendor').value;
    PO.note = $('#poNote').value;
    $$('#modalRoot .poIng').forEach(el => { const i = +el.dataset.i; if (PO.lines[i]) PO.lines[i].ingId = el.value; });
    $$('#modalRoot .poQty').forEach(el => { const i = +el.dataset.i; if (PO.lines[i]) PO.lines[i].qty = el.value; });
    $$('#modalRoot .poRate').forEach(el => { const i = +el.dataset.i; if (PO.lines[i]) PO.lines[i].rate = el.value; });
    const tot = PO.lines.reduce((a, l) => a + num(l.qty) * num(l.rate), 0);
    $('#poTotals').innerHTML = '<div class="cr"><span>Items</span><span>' + PO.lines.length + '</span></div>' +
      '<div class="cr big"><span>Order value</span><span>' + INR(tot) + '</span></div>';
  };
  read();
  $$('#modalRoot .poIng').forEach(el => el.addEventListener('change', () => {
    const i = +el.dataset.i; const ing = ingById(el.value);
    if (ing && PO.lines[i]) PO.lines[i].rate = ing.rate;
    read(); drawPO();
  }));
  $$('#modalRoot .poQty, #modalRoot .poRate').forEach(el => el.addEventListener('input', () => {
    read();
    $$('#modalRoot .poAmt').forEach(a => { const i = +a.dataset.i; const l = PO.lines[i]; if (l) a.value = r2(num(l.qty) * num(l.rate)); });
  }));
  $('#poSave').onclick = () => {
    read();
    const valid = PO.lines.filter(l => l.ingId && num(l.qty) > 0);
    if (!valid.length) { toast('Kam se kam ek item daalein', 'err'); return; }
    if (!DB.purchaseOrders) DB.purchaseOrders = [];
    const rec = {
      id: uid('po'), no: nextPONo(), date: PO.date, vendorId: PO.vendorId,
      lines: valid.map(l => ({ ingId: l.ingId, qty: r3(num(l.qty)), rate: num(l.rate) })), note: PO.note || ''
    };
    DB.purchaseOrders.push(rec);
    saveDB(); closeModal(); render();
    toast('PO saved · ' + rec.no, 'ok');
  };
}

function printPO(id) {
  const po = (DB.purchaseOrders || []).find(x => x.id === id);
  if (!po) return;
  const v = partyById(po.vendorId), m = DB.meta;
  const c = poCalc(po);
  const rows = (po.lines || []).map((l, i) => {
    const ing = ingById(l.ingId) || { name: '-', unit: '' };
    return '<tr><td>' + (i + 1) + '</td><td>' + esc(ing.name) + '</td><td>' + esc(ing.unit) + '</td>' +
      '<td style="text-align:right">' + QTY(l.qty) + '</td><td style="text-align:right">' + INR(l.rate) + '</td>' +
      '<td style="text-align:right">' + INR(num(l.qty) * num(l.rate)) + '</td></tr>';
  }).join('');
  $('#printArea').innerHTML = '<div class="card" style="padding:22px">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<div><h1 style="margin:0;font-size:20px">' + esc(m.company) + '</h1>' +
        '<div style="font-size:11.5px;color:#444;line-height:1.6">' + esc(m.address) + '<br>Phone: ' + esc(m.phone) + '<br>GSTIN: ' + esc(m.gstin) + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:15px;font-weight:800;letter-spacing:.06em">PURCHASE ORDER</div>' +
        '<div>No: <b>' + esc(po.no) + '</b></div><div>Date: ' + dmy(po.date) + '</div></div></div>' +
    '<div style="margin-top:14px;border:1px solid #dbe2ea;border-radius:4px;padding:8px 10px">' +
      '<div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:#666">Vendor</div>' +
      '<div style="font-weight:700">' + esc(v ? v.name : '—') + '</div>' +
      '<div style="font-size:11px;color:#444">' + esc(v ? (v.area || '') : '') + (v && v.phone ? ' · ' + esc(v.phone) : '') + '</div></div>' +
    '<table class="tbl" style="width:100%;margin-top:12px"><thead><tr><th>#</th><th>Item</th><th>Unit</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>' +
    '<tbody>' + rows + '</tbody><tfoot><tr><td colspan="5"><b>Total</b></td><td style="text-align:right"><b>' + INR(c.value) + '</b></td></tr></tfoot></table>' +
    (po.note ? '<div style="margin-top:10px;font-size:11.5px">Note: ' + esc(po.note) + '</div>' : '') +
    '<div style="margin-top:26px;display:flex;justify-content:space-between;font-size:11px;color:#444">' +
      '<div>Milne ki date: ' + dmy(addDays(po.date, 2)) + '</div><div>Authorised signatory</div></div></div>';
  try { window.print(); } catch (e) {}
}

Object.assign(ACT, {
  backupNow: () => { backupDownload(); DB.settings.lastBackup = TODAY; saveDB(); autoSnapshot(true); render(); },
  backupShare: () => { backupShare(); render(); },
  backupLater: () => { DB.settings.snoozeBackup = TODAY; saveDB(); render(); },
  restoreSnap: d => restoreSnapshot(d.key),
  printThermal: d => printThermal(d.inv, d.w),
  newPO: () => poModal(),
  poAdd: () => {
    const ing = DB.ingredients[0];
    PO.lines.push({ ingId: ing.id, qty: '10', rate: ing.rate });
    drawPO();
  },
  poDel: d => {
    PO.lines.splice(+d.i, 1);
    if (!PO.lines.length) PO.lines.push({ ingId: DB.ingredients[0].id, qty: '10', rate: DB.ingredients[0].rate });
    drawPO();
  },
  poReceive: d => {
    const po = (DB.purchaseOrders || []).find(x => x.id === d.id);
    if (!po) return;
    const c = poCalc(po);
    const lines = (po.lines || []).filter(l => num(l.qty) - num(l.received) > 0.0001)
      .map(l => ({ ingId: l.ingId, qty: r3(num(l.qty) - num(l.received)), rate: l.rate }));
    purchaseModal({ poId: po.id, lines: lines, partyId: po.vendorId });
  },
  printPO: d => printPO(d.id),
  delPO: d => confirmBox('PO delete karein? Received bills ledger me rahenge.', () => {
    DB.purchaseOrders = (DB.purchaseOrders || []).filter(x => x.id !== d.id);
    saveDB(); render(); toast('PO delete', 'ok');
  }),
  poFromNeeded: () => {
    const pend = pendingByProduct();
    const req = ingredientRequirement(pend);
    const stock = ingredientStock();
    const need = {};
    Object.keys(req).forEach(k => { const buy = req[k] - (stock[k] || 0); if (buy > 0.0001) need[k] = r3(buy); });
    if (!Object.keys(need).length) { toast('Abhi kuch kharidna nahi hai', 'warn'); return; }
    const byVendor = {};
    Object.keys(need).forEach(ingId => {
      const ing = ingById(ingId) || {};
      const vendor = vendors().find(v => v.name === ing.vendor) || vendors()[0];
      const key = vendor ? vendor.id : 'none';
      byVendor[key] = byVendor[key] || [];
      byVendor[key].push({ ingId: ingId, qty: need[ingId], rate: num(ing.rate) });
    });
    const count = Object.keys(byVendor).length;
    confirmBox('Pending order ki requirement se ' + count + ' vendor ke PO banayein?', () => {
      if (!DB.purchaseOrders) DB.purchaseOrders = [];
      Object.keys(byVendor).forEach(vid => {
        DB.purchaseOrders.push({
          id: uid('po'), no: nextPONo(), date: TODAY, vendorId: vid === 'none' ? (vendors()[0] || {}).id : vid,
          lines: byVendor[vid], note: 'Kya chahiye se auto PO'
        });
      });
      saveDB(); render();
      toast(count + ' PO ban gaye', 'ok');
    }, 'PO banayein');
  }
});
