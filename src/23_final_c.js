/* ================= FINAL BATCH C: LOYALTY POINTS · ASSETS & EMI · LEAVE ================= */

/* ---------------------------- 1. LOYALTY POINTS ---------------------------- */
const loyaltyPct = () => num((DB.settings && DB.settings.loyaltyPct) !== undefined ? DB.settings.loyaltyPct : 1);
const partyPoints = p => num(p && p.points);

function accruePoints(partyId, billAmt) {
  const p = partyById(partyId);
  if (!p || p.type === 'vendor') return 0;
  const pct = loyaltyPct();
  if (pct <= 0) return 0;
  const pts = Math.floor(num(billAmt) * pct / 100);
  if (pts <= 0) return 0;
  p.points = r2(partyPoints(p) + pts);
  if (!DB.loyalty) DB.loyalty = [];
  DB.loyalty.unshift({ id: uid('ly'), date: TODAY, partyId: p.id, points: pts, type: 'earn', note: 'Bill par points' });
  if (DB.loyalty.length > 500) DB.loyalty = DB.loyalty.slice(0, 500);
  return pts;
}

function redeemPoints(partyId, billAmt) {
  const p = partyById(partyId);
  if (!p) return 0;
  const have = partyPoints(p);
  if (have <= 0) return 0;
  const cap = Math.min(have, Math.floor(num(billAmt) * 0.3));
  if (cap <= 0) return 0;
  p.points = r2(have - cap);
  if (!DB.loyalty) DB.loyalty = [];
  DB.loyalty.unshift({ id: uid('ly'), date: TODAY, partyId: p.id, points: cap, type: 'use', note: 'Bill me use' });
  return cap;
}

function loyaltyCard() {
  const custs = DB.parties.filter(p => p.type !== 'vendor' && partyPoints(p) > 0).sort((a, b) => partyPoints(b) - partyPoints(a));
  const totalPts = custs.reduce((a, p) => a + partyPoints(p), 0);
  return card('🎁 Loyalty Points', 'Retail customer ko bill par points — agle bill me use kar sakte hain', '<span class="badge b-grey">' + custs.length + '</span>',
    (custs.length ? tableHTML([
      { label: 'Customer', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.area || '') + '</div>' },
      { label: 'Points', cls: 'num', render: r => '<b>' + QTY(partyPoints(r)) + '</b>' },
      { label: 'Value', cls: 'num', render: r => INR(partyPoints(r)) },
      { label: 'Udhaar', cls: 'num', render: r => INR0(partyBalance(r.id).receivable) }
    ], custs.slice(0, 10), { compact: true }) : '<div class="empty">Abhi kisi customer ke points nahi</div>') +
    '<div class="tiny muted mt">Rate: ₹' + loyaltyPct() + ' points per ₹100 ka bill · 1 point = ₹1 (Settings → Loyalty)<br>Total pending points: <b>' + QTY(totalPts) + '</b> (₹' + INR0(totalPts) + ')</div>', { tight: true });
}

/* ---------------------------- 2. ASSETS & EMI ---------------------------- */
function assetCalc(a) {
  const months = Math.max(0, num(a.tenure));
  const paid = Math.min(months, num(a.paidMonths));
  const emi = num(a.emi);
  return { emi: emi, paid: paid, months: months, paidAmt: r2(paid * emi), remaining: r2(emi * (months - paid)), balance: r2(num(a.cost) - paid * emi) };
}

function autoPostAssets() {
  const cur = monthKey(TODAY);
  let made = 0;
  (DB.assets || []).forEach(a => {
    if (!num(a.active)) return;
    if (monthKey(a.date) >= cur) return;
    if (a.lastPosted === cur) return;
    if (num(a.paidMonths) >= num(a.tenure)) return;
    DB.expenses.push({ id: uid('ex'), date: TODAY, vertical: a.vertical || 'common', category: 'Machine Maintenance', amount: r2(num(a.emi)), note: (a.name || 'Asset') + ' EMI (auto)' });
    a.lastPosted = cur;
    a.paidMonths = num(a.paidMonths) + 1;
    made++;
  });
  if (made) { DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1); saveDB(); }
  return made;
}

function assetModal(id) {
  const a = id ? (DB.assets || []).find(x => x.id === id) : null;
  openForm({
    title: a ? 'Asset edit' : 'Naya Asset / EMI', sub: 'Machine, fridge, oven — EMI har mahine kharcha me jayegi', width: 580,
    values: a || { date: TODAY, tenure: 12, vertical: 'common', active: 1 },
    fields: [
      { key: 'name', label: 'Asset ka naam', type: 'text', placeholder: 'jaise: Deep Freezer 500L' },
      { key: 'date', label: 'Kharida / EMI shuru', type: 'date' },
      { key: 'cost', label: 'Total cost ₹', type: 'text' },
      { key: 'emi', label: 'EMI / mahina ₹', type: 'text', gold: true },
      { key: 'tenure', label: 'Kitne mahine', type: 'text' },
      { key: 'vertical', label: 'Kis vertical ka', type: 'select', options: [{ value: 'bakery', label: 'Bakery' }, { value: 'store', label: 'Store' }, { value: 'supply', label: 'Supply' }, { value: 'common', label: 'Common' }] },
      { key: 'active', label: 'Auto EMI chalu', type: 'select', options: [{ value: 1, label: 'Haan' }, { value: 0, label: 'Nahi' }] }
    ],
    submit: 'Save karein',
    onSubmit: d => {
      if (!d.name.trim() || num(d.emi) <= 0) { toast('Naam aur EMI daalein', 'err'); return false; }
      if (!DB.assets) DB.assets = [];
      const rec = {
        id: a ? a.id : uid('as'), name: d.name.trim(), date: d.date || TODAY, cost: r2(num(d.cost)),
        emi: r2(num(d.emi)), tenure: Math.max(1, num(d.tenure) || 12), vertical: d.vertical,
        paidMonths: a ? num(a.paidMonths) : 0, lastPosted: a ? a.lastPosted : '', active: num(d.active)
      };
      if (a) Object.assign(a, rec); else DB.assets.push(rec);
      saveDB(); logAct('Asset saved', rec.name);
      toast('Asset saved · EMI ' + INR0(rec.emi) + '/mahina', 'ok');
    }
  });
}

function viewAssets() {
  const list = (DB.assets || []).map(a => ({ a: a, c: assetCalc(a) }));
  const emiTotal = list.reduce((x, r) => x + (num(r.a.active) ? r.c.emi : 0), 0);
  const remaining = list.reduce((x, r) => x + r.c.remaining, 0);
  const paid = list.reduce((x, r) => x + r.c.paidAmt, 0);
  return pageHead('Assets & EMI', 'Machine, fridge, oven — EMI auto kharcha me',
      '<button class="btn primary" data-act="newAsset">+ Naya Asset</button>' +
      '<button class="btn" data-act="postEmi">EMI post karein</button>') +
    '<div class="kpis mb">' +
      tile('Monthly EMI', INR0(emiTotal), '<span>' + list.filter(r => num(r.a.active)).length + ' assets chalu</span>', 'red') +
      tile('Ab tak diya', INR0(paid), '<span>EMI se</span>') +
      tile('Bacha hai', INR0(remaining), '<span>' + list.length + ' assets</span>', 'amber') +
      tile('Total cost', INR0(list.reduce((x, r) => x + num(r.a.cost), 0)), '<span>machine + equipment</span>') +
    '</div>' +
    card('Asset register', 'EMI apne aap "Machine Maintenance" kharcha me jati hai', '<span class="badge b-grey">' + list.length + '</span>',
      tableHTML([
        { label: 'Asset', render: r => '<b>' + esc(r.a.name) + '</b><div class="tiny muted">' + (VLABEL[r.a.vertical] || r.a.vertical) + ' · ' + dmy(r.a.date) + '</div>' },
        { label: 'Cost', cls: 'num', render: r => INR(r.a.cost) },
        { label: 'EMI', cls: 'num', render: r => '<b>' + INR(r.c.emi) + '</b><div class="tiny muted">' + r.c.months + ' mahine</div>' },
        { label: 'Diye', cls: 'num', render: r => r.c.paid + ' / ' + r.c.months },
        { label: 'Bacha', cls: 'num', render: r => '<b>' + INR(r.c.remaining) + '</b>' },
        { label: 'Status', cls: 'center', render: r => num(r.a.active) ? '<span class="badge b-green">chalu</span>' : '<span class="badge b-grey">band</span>' },
        { label: '', render: r => '<div style="display:flex;gap:4px;justify-content:flex-end"><button class="btn sm" data-act="editAsset" data-id="' + r.a.id + '">Edit</button><button class="btn sm danger" data-act="delAsset" data-id="' + r.a.id + '">✕</button></div>' }
      ], list, { compact: true, emptyTitle: 'Koi asset add nahi kiya', empty: 'Fridge, oven, mixer — EMI ke saath add karein.' }), { tight: true });
}

/* ---------------------------- 3. PAID LEAVE ---------------------------- */
function leaveSummary(staffId, month) {
  const recs = (DB.attendance || []).filter(a => a.staffId === staffId && monthKey(a.date) === month);
  return {
    P: recs.filter(a => a.status === 'P').length,
    L: recs.filter(a => a.status === 'L').length,
    H: recs.filter(a => a.status === 'H').length,
    A: recs.filter(a => a.status === 'A').length
  };
}

Object.assign(ACT, {
  newAsset: () => assetModal(null),
  editAsset: d => assetModal(d.id),
  delAsset: d => confirmBox('Asset delete karein?', () => {
    DB.assets = (DB.assets || []).filter(x => x.id !== d.id); saveDB(); render(); toast('Asset delete', 'ok');
  }),
  postEmi: () => {
    const n = autoPostAssets();
    render(); toast(n ? n + ' EMI post ho gayi' : 'Is mahine ki EMI pehle se post hai', n ? 'ok' : 'warn');
  },
  attLeave: d => {
    if (!DB.attendance) DB.attendance = [];
    const ex = attOf(d.id, ATT_DATE);
    if (ex) { if (ex.status === 'L') DB.attendance = DB.attendance.filter(a => a !== ex); else ex.status = 'L'; }
    else DB.attendance.push({ id: uid('at'), date: ATT_DATE, staffId: d.id, status: 'L', ot: 0 });
    saveDB(); render();
  },
  saveLoyalty: () => {
    const v = num(($('#loyaltyPct') || {}).value);
    DB.settings.loyaltyPct = Math.max(0, v);
    saveDB(); render(); toast('Loyalty rate save ho gaya · ₹' + DB.settings.loyaltyPct + ' points per ₹100', 'ok');
  }
});

/* ---------------------------- 4. TUTORIAL VIDEO POPUP ---------------------------- */
const TUT_CHAPTERS = [
  ['01', 'Intro — pura system ek nazar me', '0:00'],
  ['02', 'Setup: dukaan, GSTIN, FY', '0:12'],
  ['03', 'Costing: rate badla, cost khud + combo', '0:22'],
  ['04', 'Production + Kal ka Plan', '0:32'],
  ['05', 'Bill: discount, round-off, loyalty', '0:42'],
  ['06', 'Udhaar: bill-wise payment, ageing', '0:52'],
  ['07', 'Purchase, return, vendor payment', '1:02'],
  ['08', 'Reports: P&L, GST, GSTR-1 / HSN', '1:11'],
  ['09', 'Mobile: menu chunte hi band', '1:22'],
  ['10', 'Backup + shuruaat', '1:31']
];

function tutorialBodyHTML() {
  return '<video id="tutVid" controls playsinline preload="metadata" poster="tutorial-poster.jpg" ' +
      'style="width:100%;max-height:430px;border-radius:10px;background:#0b1220;display:block" ' +
      'src="tutorial.mp4" onerror="var e=document.getElementById(\'tutFallback\'); if(e) e.style.display=\'flex\';">' +
      '<div class="alert red" style="margin:10px 0">Browser video support nahi kar raha — file download karke kholein.</div>' +
    '</video>' +
    '<div class="alert" id="tutFallback" style="display:none;margin-top:10px">' +
      '<span class="ic">🎬</span><div><b>Video file nahi mili.</b> <span class="tiny">' +
      '<code>tutorial.mp4</code> ko isi folder me rakhein jahan ye HTML file hai (GitHub se download karte waqt saath aati hai). ' +
      'Video ke bina bhi app poora chalta hai.</span></div></div>' +
    '<div class="grid cols-1-2 mt" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px">' +
      '<div>' + card('Chapters', 'Video me kya-kya hai', '',
        tableHTML([
          { label: '#', render: r => '<span class="mono tiny">' + r[0] + '</span>' },
          { label: 'Topic', render: r => esc(r[1]) },
          { label: 'Time', cls: 'num', render: r => '<span class="tiny muted">' + r[2] + '</span>' }
        ], TUT_CHAPTERS, { compact: true }), { tight: true }) + '</div>' +
      '<div>' + card('5 minute me shuru karein', 'Naye user ke liye sabse chhota rasta', '',
        '<div class="kv" style="line-height:1.9">' +
          '<div class="k">1.</div><div>Masters → Setup: naam, GSTIN, FY</div>' +
          '<div class="k">2.</div><div>Masters → Ingredients: rate daalein</div>' +
          '<div class="k">3.</div><div>Bakery → Recipe &amp; Cost: product banayein</div>' +
          '<div class="k">4.</div><div>Bakery → Production: aaj ka batch</div>' +
          '<div class="k">5.</div><div>Store → Counter Sales: pehla bill</div>' +
          '<div class="k">6.</div><div>Reports → P&amp;L: munafa dekhein</div>' +
        '</div>' +
        '<div class="tiny muted mt">Detail guide: repo ke <code>docs/Dream-Sandwich-Guide.md</code> me.</div>', { tight: true }) + '</div>' +
    '</div>';
}

function tutorialModal() {
  openModal({
    title: '🎬 Tutorial video', sub: '1 min 41 sec · cinematic demo — setup se GST report tak',
    width: 900, focus: false,
    body: tutorialBodyHTML(),
    foot: '<button class="btn" data-act="closeModal">Band karein</button>' +
      '<button class="btn primary" data-act="nav" data-view="setup">Setup par jayein</button>'
  });
}

Object.assign(ACT, { tutorial: () => tutorialModal() });
