/* ================= LOGIN / ROLE · REMINDERS · BARCODE · ATTENDANCE ================= */
let SESSION = { role: '' };
let ATT_DATE = TODAY;
let ATT_MONTH = monthKey(TODAY);
const daysSince = d => d ? Math.max(0, daysBetween(d, TODAY)) : 0;

/* ---------------------------- 1. LOGIN / ROLE ---------------------------- */
const ROLE_OK = ['dashboard', 'daily', 'bakery', 'store', 'supply'];
const pinsOf = () => (DB.settings && DB.settings.pins) || { owner: '1234', counter: '0000' };
const pinOn = () => !!(DB.settings && num(DB.settings.pinOn));

function gateNeeded() { return pinOn() && !SESSION.role; }

function openGate() {
  if ($('#gate')) return;
  const d = document.createElement('div');
  d.id = 'gate';
  d.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit';
  d.innerHTML =
    '<div style="width:100%;max-width:420px;background:#fff;border-radius:14px;padding:26px;box-shadow:0 24px 60px rgba(0,0,0,.4)">' +
      '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;font-weight:700">' + esc(DB.meta.company || 'Dream Sandwich') + '</div>' +
      '<h2 style="font-size:22px;margin:6px 0 2px;font-weight:800;letter-spacing:-.02em">Kaun hai? Login karein</h2>' +
      '<div style="font-size:12.5px;color:#64748b;margin-bottom:16px">Owner ko pura access · Counter boy ko sirf roz ka kaam</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:14px">' +
        '<button class="btn" data-act="gateRole" data-r="owner" style="flex:1;padding:12px">👑 Owner</button>' +
        '<button class="btn" data-act="gateRole" data-r="counter" style="flex:1;padding:12px">🧾 Counter</button>' +
      '</div>' +
      '<label style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">PIN</label>' +
      '<input id="gatePin" type="password" inputmode="numeric" maxlength="6" placeholder="••••" style="width:100%;margin-top:5px;padding:12px;font-size:20px;letter-spacing:.4em;text-align:center;border:1px solid #dbe2ea;border-radius:8px">' +
      '<div id="gateMsg" style="font-size:12px;color:#c02626;height:16px;margin-top:6px"></div>' +
      '<button class="btn primary" data-act="gateUnlock" style="width:100%;padding:12px;margin-top:6px">Unlock</button>' +
      '<div style="font-size:11px;color:#9ca3af;margin-top:12px;line-height:1.6">Default PIN — Owner: 1234 · Counter: 0000.<br>Settings → Login me badal dein.</div>' +
    '</div>';
  document.body.appendChild(d);
  const inp = $('#gatePin');
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') ACT.gateUnlock(); });
  setTimeout(() => inp.focus(), 80);
}

function closeGate() {
  const g = $('#gate');
  if (g) g.remove();
}

function applyRole() {
  const sec = sectionOf(current);
  if (SESSION.role === 'counter' && ROLE_OK.indexOf(sec.id) < 0) current = 'dashboard';
  render();
}

function roleBadgeHTML() {
  if (!pinOn()) return '';
  return '<button class="btn sm" data-act="lockApp" title="Lock">🔒 ' + (SESSION.role === 'counter' ? 'Counter' : 'Owner') + '</button>';
}

/* ---------------------------- 2. REMINDERS / WHATSAPP ---------------------------- */
function pendingBills(partyId) {
  const list = DB.sales.filter(s => s.partyId === partyId && s.payMode === 'credit');
  if (!list.length) return { amount: 0, oldest: '', bills: 0 };
  const dates = list.map(s => s.date).sort();
  return { amount: partyBalance(partyId).receivable, oldest: dates[0], bills: list.length };
}

function reminderText(p) {
  const bal = partyBalance(p.id).receivable;
  const m = DB.meta;
  const pb = pendingBills(p.id);
  const days = pb.oldest ? daysBetween(pb.oldest, TODAY) : 0;
  return 'Namaste ' + p.name + ' ji,\n\n' +
    m.company + ' se — aapka udhaar ₹' + r2(bal) + ' baaki hai' +
    (pb.oldest ? ' (' + dmy(pb.oldest) + ' se, ' + days + ' din)' : '') + '.\n' +
    'Kripya payment kar dein — Cash / UPI.\n\n' +
    'Dhanyavaad,\n' + m.company + (m.phone ? '\n' + m.phone : '') + (m.gstin ? '\nGSTIN: ' + m.gstin : '');
}

function billText(invNo) {
  const lines = DB.sales.filter(s => s.invNo === invNo);
  if (!lines.length) return '';
  const p = partyById(lines[0].partyId);
  const m = DB.meta;
  let total = 0;
  const body = lines.map((s, i) => {
    const pr = productById(s.productId) || { name: '-' };
    total += num(s.qty) * num(s.rate);
    return (i + 1) + '. ' + pr.name + ' — ' + QTY(s.qty) + ' × ₹' + r2(s.rate) + ' = ₹' + r2(num(s.qty) * num(s.rate));
  }).join('\n');
  return 'Namaste ' + (p ? p.name : 'ji') + ',\n\n' + m.company + ' ka bill ' + invNo + ' (' + dmy(lines[0].date) + '):\n\n' +
    body + '\n\nTotal: ₹' + r2(total) + '\nPayment: ' + (lines[0].payMode === 'credit' ? 'Udhaar' : lines[0].payMode === 'upi' ? 'UPI' : 'Cash') +
    '\n\nDhanyavaad!\n' + m.company + (m.phone ? '\n' + m.phone : '');
}

function copyBox(title, text) {
  let ok = false;
  try { navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
  openModal({
    title: title, sub: ok ? 'Text copy ho gaya — WhatsApp me paste kar dein' : 'Text select karke copy karein (Ctrl+C)', width: 620,
    body: '<textarea id="copyArea" style="width:100%;height:210px;font-size:13px;line-height:1.6;padding:10px;border:1px solid #dbe2ea;border-radius:8px;font-family:inherit;white-space:pre-wrap">' + esc(text) + '</textarea>',
    foot: '<button class="btn" data-act="closeModal">Band karein</button><button class="btn primary" data-act="copyAgain">Copy karein</button>'
  });
  setTimeout(() => { const a = $('#copyArea'); if (a) { a.focus(); a.select(); } }, 60);
}

function waLink(phone, text) {
  const ph = String(phone || '').replace(/[^0-9]/g, '');
  const num91 = ph.length === 10 ? '91' + ph : ph;
  return 'https://wa.me/' + num91 + '?text=' + encodeURIComponent(text);
}

function viewReminders() {
  const list = DB.parties.filter(p => p.type !== 'vendor')
    .map(p => ({ p: p, bal: partyBalance(p.id).receivable, pb: pendingBills(p.id) }))
    .filter(r => r.bal > 0.5)
    .sort((a, b) => b.bal - a.bal);
  const total = list.reduce((a, r) => a + r.bal, 0);
  const overdue = list.filter(r => r.pb.oldest && daysBetween(r.pb.oldest, TODAY) > num(r.p.creditDays || 15));
  const noPhone = list.filter(r => !String(r.p.phone || '').trim()).length;

  const invs = [];
  DB.sales.filter(s => s.invNo).forEach(s => { if (invs.indexOf(s.invNo) < 0) invs.push(s.invNo); });
  const recent = invs.sort().reverse().slice(0, 8).map(inv => {
    const ls = DB.sales.filter(s => s.invNo === inv);
    const party = partyById(ls[0].partyId);
    return { inv: inv, party: party, date: ls[0].date, amt: ls.reduce((a, s) => a + num(s.qty) * num(s.rate), 0) };
  });

  const allText = 'Udhaar list — ' + DB.meta.company + ' (' + dmy(TODAY) + ')\n\n' +
    list.map((r, i) => (i + 1) + '. ' + r.p.name + ' — ₹' + r2(r.bal) + (r.pb.oldest ? ' (' + daysSince(r.pb.oldest) + ' din)' : '')).join('\n') +
    '\n\nTotal: ₹' + r2(total);

  return pageHead('Udhaar Reminders', 'WhatsApp message taiyaar — copy karein ya seedha bhejein',
      '<button class="btn" data-act="copyAllReminders">Sabki list copy</button>' +
      '<button class="btn" data-act="printReport" data-title="Udhaar Reminders">Print</button>') +

    '<div class="kpis mb">' +
      tile('Total udhaar', INR0(total), '<span>' + list.length + ' parties</span>', 'red') +
      tile('Overdue', overdue.length, '<span>' + INR0(overdue.reduce((a, r) => a + r.bal, 0)) + ' · credit days cross</span>', overdue.length ? 'red' : 'green') +
      tile('Sabse purana', list.length ? daysSince(list[0].pb.oldest || TODAY) + ' din' : '—', '<span>' + (list.length ? esc(list[0].p.name) : '') + '</span>', 'amber') +
      tile('Phone missing', noPhone, '<span>WhatsApp nahi ja payega</span>', noPhone ? 'amber' : 'green') +
    '</div>' +

    card('Reminder list', 'Bada udhaar sabse upar · WhatsApp button se message khulega', '<span class="badge b-grey">' + list.length + '</span>',
      tableHTML([
        { label: 'Party', render: r => '<b>' + esc(r.p.name) + '</b><div class="tiny muted">' + esc(r.p.area || '') + (r.p.phone ? ' · ' + esc(r.p.phone) : ' · <span style="color:#b45309">phone nahi</span>') + '</div>' },
        { label: 'Baki', cls: 'num', render: r => '<b class="neg">' + INR(r.bal) + '</b>' },
        { label: 'Purana bill', render: r => r.pb.oldest ? '<span class="badge ' + (daysSince(r.pb.oldest) > num(r.p.creditDays || 15) ? 'b-red' : 'b-amber') + '">' + daysSince(r.pb.oldest) + ' din</span>' : '—' },
        { label: 'Limit', render: r => r.bal > num(r.p.creditLimit || 0) && num(r.p.creditLimit) ? '<span class="badge b-red">cross</span>' : '<span class="tiny muted">' + INR0(r.p.creditLimit) + '</span>' },
        { label: 'Message', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="copyReminder" data-id="' + r.p.id + '">Copy</button>' +
            (String(r.p.phone || '').trim() ? '<a class="btn sm primary" href="' + waLink(r.p.phone, reminderText(r.p)) + '" target="_blank" rel="noopener">WhatsApp</a>' : '<button class="btn sm" data-act="editParty" data-id="' + r.p.id + '">+ Phone</button>') +
          '</div>' }
      ], list, { compact: true, emptyTitle: 'Koi udhaar baaki nahi 🎉', empty: 'Sab payment mil gaya.' }), { tight: true }) +

    '<div class="mt">' + card('Bills — WhatsApp bhejein', 'Bill ka text copy karke party ko bhej dein', '',
      tableHTML([
        { label: 'Bill No', render: r => '<b>' + esc(r.inv) + '</b>' },
        { label: 'Party', render: r => esc(r.party ? r.party.name : '—') },
        { label: 'Date', render: r => dmy(r.date) },
        { label: 'Amount', cls: 'num', render: r => INR(r.amt) },
        { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="printInv" data-inv="' + esc(r.inv) + '">A4</button>' +
            '<button class="btn sm" data-act="printThermal" data-inv="' + esc(r.inv) + '" data-w="58">58mm</button>' +
            '<button class="btn sm" data-act="copyBill" data-inv="' + esc(r.inv) + '">Copy text</button>' +
            (r.party && String(r.party.phone || '').trim() ? '<a class="btn sm primary" href="' + waLink(r.party.phone, billText(r.inv)) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') +
          '</div>' }
      ], recent, { compact: true, emptyTitle: 'Koi bill nahi bana' }), { tight: true }) + '</div>';
}

/* ---------------------------- 3. BARCODE (Code 39) ---------------------------- */
const C39 = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn',
  'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn',
  'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn',
  'Z': 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn'
};

function barcodeSVG(text, opts) {
  opts = opts || {};
  const h = opts.height || 46, unit = opts.unit || 1.6, quiet = 8;
  const clean = String(text || '').toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '');
  if (!clean) return '';
  const chars = ('*' + clean + '*').split('');
  let x = quiet, bars = '';
  chars.forEach((ch, ci) => {
    const pat = C39[ch] || C39['-'];
    for (let i = 0; i < 9; i++) {
      const w = (pat[i] === 'w' ? 3 : 1) * unit;
      if (i % 2 === 0) bars += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="' + h + '" fill="#111827"/>';
      x += w;
    }
    if (ci < chars.length - 1) x += unit;
  });
  const total = x + quiet;
  return '<div style="text-align:center;margin:8px 0 2px">' +
    '<svg width="' + total.toFixed(0) + '" height="' + h + '" viewBox="0 0 ' + total.toFixed(0) + ' ' + h + '" style="max-width:100%">' + bars + '</svg>' +
    '<div style="font-family:monospace;font-size:11px;letter-spacing:.16em;color:#111">' + esc(clean) + '</div></div>';
}

/* ---------------------------- 4. ATTENDANCE + ADVANCE ---------------------------- */
function attOf(staffId, date) {
  return (DB.attendance || []).find(a => a.staffId === staffId && a.date === date);
}

function attSummary(staffId, month) {
  const s = DB.staff.find(x => x.id === staffId) || {};
  const recs = (DB.attendance || []).filter(a => a.staffId === staffId && monthKey(a.date) === month);
  const P = recs.filter(a => a.status === 'P').length;
  const A = recs.filter(a => a.status === 'A').length;
  const H = recs.filter(a => a.status === 'H').length;
  const L = recs.filter(a => a.status === 'L').length;
  const ot = recs.reduce((x, a) => x + num(a.ot), 0);
  const hasAtt = recs.length > 0;
  const days = hasAtt ? (P + L + H * 0.5) : (s.payType === 'monthly' ? 26 : num(s.daysPresent));
  const baseRate = num(s.rate);
  const perDay = s.payType === 'monthly' ? baseRate / 26 : baseRate;
  const earned = r2(perDay * Math.min(days, 31));
  const otRate = r2(perDay / 8);
  const otAmt = r2(ot * otRate);
  const adv = r2((DB.advances || []).filter(a => a.staffId === staffId && monthKey(a.date) === month).reduce((x, a) => x + num(a.amount), 0));
  const paid = r2((DB.salaryPaid || []).filter(x => x.staffId === staffId && x.month === month).reduce((x, p) => x + num(p.amount), 0));
  const rawPay = r2(earned + otAmt - adv - paid);
  return { s: s, P: P, A: A, H: H, L: L, ot: ot, days: days, perDay: perDay, earned: earned, otAmt: otAmt, adv: adv, paid: paid, payable: Math.abs(rawPay) < 1 ? 0 : rawPay, hasAtt: hasAtt };
}

function viewAttendance() {
  if (!DB.staff.length) {
    return pageHead('Attendance & Salary', 'Haziri, overtime, advance aur salary', '') +
      '<div class="empty"><b>Pehle staff add karein</b>Naam, rate aur vertical daalne par haziri yahan lagegi.' +
      '<div style="margin-top:10px"><button class="btn primary" data-act="newStaff">+ Staff</button></div></div>';
  }
  const months = Array.from(new Set([monthKey(TODAY)].concat((DB.attendance || []).map(a => monthKey(a.date))))).sort().reverse();
  if (months.indexOf(ATT_MONTH) < 0) ATT_MONTH = months[0];
  const rows = DB.staff.map(s => Object.assign({ staff: s }, attSummary(s.id, ATT_MONTH)));
  const presentToday = DB.staff.filter(s => { const a = attOf(s.id, ATT_DATE); return a && a.status === 'P'; }).length;
  const markedToday = DB.staff.filter(s => !!attOf(s.id, ATT_DATE)).length;
  const payable = rows.reduce((a, r) => a + Math.max(0, r.payable), 0);
  const advTotal = rows.reduce((a, r) => a + r.adv, 0);

  return pageHead('Attendance & Salary', 'Haziri lagayein → salary aur advance auto niklega',
      '<div class="period"><button class="btn sm" data-act="attShift" data-d="-1">◀</button>' +
        '<input type="date" data-act="attDate" value="' + ATT_DATE + '">' +
        '<button class="btn sm" data-act="attShift" data-d="1">▶</button></div>' +
      '<select class="btn" data-act="attMonth" style="padding-right:8px">' + months.map(m => '<option value="' + m + '"' + (m === ATT_MONTH ? ' selected' : '') + '>' + monthName(m) + '</option>').join('') + '</select>' +
      '<button class="btn" data-act="payAll">Sabki salary pay</button>') +

    '<div class="kpis mb">' +
      tile(dmy(ATT_DATE) + ' ki haziri', presentToday + ' / ' + DB.staff.length, '<span>' + (DB.staff.length - markedToday) + ' log baaki</span>') +
      tile(monthName(ATT_MONTH) + ' earned', INR0(rows.reduce((a, r) => a + r.earned + r.otAmt, 0)), '<span>' + rows.length + ' staff</span>') +
      tile('Advance diya', INR0(advTotal), '<span>salary se katega</span>', advTotal ? 'amber' : '') +
      tile('Payable', INR0(payable), '<span>abhi dena hai</span>', payable ? 'red' : 'green') +
    '</div>' +

    card('Haziri — ' + dmy(ATT_DATE), 'P = present · L = paid leave · H = half day · A = absent · OT = extra ghante', '',
      tableHTML([
        { label: 'Staff', render: r => '<b>' + esc(r.staff.name) + '</b><div class="tiny muted">' + esc(r.staff.role || '') + '</div>' },
        { label: 'Status', cls: 'center', render: r => {
          const a = attOf(r.staff.id, ATT_DATE); const st = a ? a.status : '';
          const b = (code, label) => '<button class="btn sm' + (st === code ? ' primary' : '') + '" data-act="attSet" data-id="' + r.staff.id + '" data-st="' + code + '">' + label + '</button>';
          return '<div style="display:flex;gap:4px;justify-content:center">' + b('P', 'P') + b('L', 'L') + b('H', 'H') + b('A', 'A') + '</div>';
        } },
        { label: 'OT hrs', cls: 'num', render: r => { const a = attOf(r.staff.id, ATT_DATE) || {}; return '<input type="text" class="attOT" data-id="' + r.staff.id + '" value="' + (num(a.ot) || '') + '" placeholder="0" style="width:60px;text-align:right">'; } },
        { label: 'Month: P / L / A', cls: 'num', render: r => r.hasAtt ? r.P + ' / ' + (r.L || 0) + ' / ' + r.A : '<span class="tiny muted">haziri nahi (' + QTY(r.days) + ' din maane)</span>' },
        { label: 'Earned', cls: 'num', render: r => INR(r.earned + r.otAmt) },
        { label: 'Payable', cls: 'num', render: r => '<b>' + INR(Math.max(0, r.payable)) + '</b>' }
      ], rows, { compact: true }), { tight: true }) +

    '<div class="mt">' + card('Salary — ' + monthName(ATT_MONTH), 'Earned − advance − jo pay ho chuka', '<span class="badge b-grey">' + rows.length + '</span>',
      tableHTML([
        { label: 'Staff', render: r => '<b>' + esc(r.s.name) + '</b><div class="tiny muted">' + (r.s.payType === 'monthly' ? 'Monthly ' + INR0(r.s.rate) : 'Daily ' + INR0(r.s.rate)) + ' · ' + (VLABEL[r.s.vertical] || r.s.vertical) + '</div>' },
        { label: 'Days', cls: 'num', render: r => QTY(r.days) },
        { label: 'Earned', cls: 'num', render: r => INR(r.earned) },
        { label: 'OT', cls: 'num', render: r => r.ot ? QTY(r.ot) + ' h · ' + INR(r.otAmt) : '—' },
        { label: 'Advance', cls: 'num', render: r => r.adv ? '<span class="neg">-' + INR0(r.adv) + '</span>' : '—' },
        { label: 'Paid', cls: 'num', render: r => r.paid ? '<span class="pos">' + INR0(r.paid) + '</span>' : '—' },
        { label: 'Payable', cls: 'num', render: r => '<b>' + INR(Math.max(0, r.payable)) + '</b>' },
        { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="newAdvance" data-id="' + r.s.id + '">+ Advance</button>' +
            (Math.max(0, r.payable) > 0.5 ? '<button class="btn sm primary" data-act="paySalary" data-id="' + r.s.id + '">Pay</button>' : '<span class="badge b-green">clear</span>') +
          '</div>' }
      ], rows, { compact: true }), { tight: true }) + '</div>' +

    '<div class="tiny muted mt">Tip: haziri na lagane par purana "days" field use hota hai, isliye demo data me bhi salary dikhti hai.</div>';
}

Object.assign(ACT, {
  /* login */
  gateRole: d => {
    const r = d.r;
    const pins = pinsOf();
    const inp = $('#gatePin');
    SESSION.pendingRole = r;
    $$('#gate .btn').forEach(b => { if (b.dataset.r) b.className = 'btn' + (b.dataset.r === r ? ' primary' : ''); });
    if (inp) { inp.value = ''; inp.focus(); }
    const msg = $('#gateMsg'); if (msg) msg.textContent = (r === 'owner' ? 'Owner' : 'Counter') + ' ka PIN daalein';
  },
  gateUnlock: () => {
    const r = SESSION.pendingRole || 'owner';
    const pin = ($('#gatePin') || {}).value || '';
    const pins = pinsOf();
    if (String(pin) !== String(pins[r] || '')) {
      const msg = $('#gateMsg'); if (msg) { msg.style.color = '#c02626'; msg.textContent = 'PIN galat hai — dobara try karein'; }
      return;
    }
    SESSION.role = r;
    closeGate();
    current = r === 'counter' ? 'dashboard' : current;
    render();
    toast((r === 'owner' ? 'Owner' : 'Counter') + ' login ho gaya', 'ok');
  },
  lockApp: () => { SESSION.role = ''; SESSION.pendingRole = 'owner'; openGate(); },
  /* reminders */
  copyReminder: d => { const p = partyById(d.id); if (p) copyBox('Message — ' + p.name, reminderText(p)); },
  copyAllReminders: () => {
    const list = DB.parties.filter(p => p.type !== 'vendor').map(p => ({ p: p, bal: partyBalance(p.id).receivable })).filter(r => r.bal > 0.5).sort((a, b) => b.bal - a.bal);
    const txt = 'Udhaar list — ' + DB.meta.company + ' (' + dmy(TODAY) + ')\n\n' + list.map((r, i) => (i + 1) + '. ' + r.p.name + ' — ₹' + r2(r.bal) + (r.p.phone ? ' · ' + r.p.phone : '')).join('\n');
    copyBox('Sabki udhaar list', txt);
  },
  copyBill: d => copyBox('Bill text — ' + d.inv, billText(d.inv)),
  copyAgain: () => {
    const a = $('#copyArea'); if (!a) return;
    try { navigator.clipboard.writeText(a.value); } catch (e) {}
    a.select();
    try { document.execCommand('copy'); } catch (e) {}
    toast('Copy ho gaya', 'ok');
  },
  /* attendance */
  attShift: d => { ATT_DATE = addDays(ATT_DATE, Number(d.d)); render(); },
  attDate: el => { ATT_DATE = el.value || TODAY; render(); },
  attMonth: el => { ATT_MONTH = el.value; render(); },
  attSet: d => {
    if (!DB.attendance) DB.attendance = [];
    const ex = attOf(d.id, ATT_DATE);
    if (ex) { if (ex.status === d.st) { DB.attendance = DB.attendance.filter(a => a !== ex); } else ex.status = d.st; }
    else DB.attendance.push({ id: uid('at'), date: ATT_DATE, staffId: d.id, status: d.st, ot: 0 });
    saveDB(); render();
  },
  newAdvance: d => {
    const s = DB.staff.find(x => x.id === d.id);
    if (!s) return;
    openForm({
      title: 'Advance — ' + s.name, sub: 'Advance diya — salary se kat jayega', width: 520,
      values: { date: TODAY, mode: 'cash' },
      fields: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'amount', label: 'Amount ₹', type: 'text', gold: true },
        { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI / Bank' }] },
        { key: 'note', label: 'Note', type: 'text', full: true, placeholder: 'jaise: ghar ke liye' }
      ],
      submit: 'Advance save karein',
      onSubmit: v => {
        const amt = num(v.amount);
        if (amt <= 0) { toast('Amount daalein', 'err'); return false; }
        if (!DB.advances) DB.advances = [];
        DB.advances.push({ id: uid('adv'), date: v.date || TODAY, staffId: s.id, amount: r2(amt), mode: v.mode, note: v.note || '' });
        saveDB(); toast('Advance ' + INR0(amt) + ' — ' + s.name, 'ok');
      }
    });
  },
  paySalary: d => {
    const r = attSummary(d.id, ATT_MONTH);
    const amt = Math.max(0, r.payable);
    if (amt <= 0.5) { toast('Kuch payable nahi', 'warn'); return; }
    confirmBox('Salary pay karein — ' + r.s.name + ' ₹' + r2(amt) + ' (' + monthName(ATT_MONTH) + ')?', () => {
      if (!DB.salaryPaid) DB.salaryPaid = [];
      DB.salaryPaid.push({ id: uid('sp'), date: TODAY, month: ATT_MONTH, staffId: r.s.id, amount: r2(amt) });
      DB.expenses.push({ id: uid('ex'), date: TODAY, vertical: r.s.vertical, category: 'Staff Salary', amount: r2(amt), note: r.s.name + ' · ' + monthName(ATT_MONTH) });
      DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); toast('Salary pay ho gayi: ' + r.s.name + ' ' + INR0(amt), 'ok');
    }, 'Pay karein');
  },
  payAll: () => {
    const rows = DB.staff.map(s => attSummary(s.id, ATT_MONTH)).filter(r => r.payable > 0.5);
    if (!rows.length) { toast('Kisi ki salary payable nahi', 'warn'); return; }
    const total = rows.reduce((a, r) => a + r.payable, 0);
    confirmBox('Sabki salary pay karein — ' + rows.length + ' staff · ₹' + r2(total) + '?', () => {
      if (!DB.salaryPaid) DB.salaryPaid = [];
      rows.forEach(r => {
        DB.salaryPaid.push({ id: uid('sp'), date: TODAY, month: ATT_MONTH, staffId: r.s.id, amount: r2(r.payable) });
        DB.expenses.push({ id: uid('ex'), date: TODAY, vertical: r.s.vertical, category: 'Staff Salary', amount: r2(r.payable), note: r.s.name + ' · ' + monthName(ATT_MONTH) });
      });
      DB.expenses.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); toast('Salary pay ho gayi · ' + INR0(total), 'ok');
    }, 'Sabko pay karein');
  }
});

/* OT input binding (debounced on blur) */
document.addEventListener('change', e => {
  const el = e.target;
  if (el && el.classList && el.classList.contains('attOT')) {
    const id = el.dataset.id;
    const v = num(el.value);
    if (!DB.attendance) DB.attendance = [];
    let a = attOf(id, ATT_DATE);
    if (!a) { a = { id: uid('at'), date: ATT_DATE, staffId: id, status: 'P', ot: 0 }; DB.attendance.push(a); }
    a.ot = v;
    saveDB(); render();
  }
});
