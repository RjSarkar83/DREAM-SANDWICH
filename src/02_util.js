/* ================= DREAM SANDWICH — CORE UTILS ================= */
'use strict';

/* ---- safe storage (sandboxed preview me localStorage block ho sakta hai) ---- */
const LS = (() => {
  try {
    localStorage.setItem('__ds_test', '1');
    localStorage.removeItem('__ds_test');
    return localStorage;
  } catch (e) {
    const mem = {};
    return {
      getItem: k => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: k => { delete mem[k]; },
      __memory: true
    };
  }
})();
const STORE_KEY = 'dream_sandwich_v2';

/* ---- tiny DOM helpers ---- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---- numbers / money ---- */
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const r3 = n => Math.round((Number(n) || 0) * 1000) / 1000;
const INR = n => '₹' + r2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INR0 = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const money = n => { n = r2(n); return (n < 0 ? '-₹' : '₹') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const QTY = n => { const v = r3(n); return v.toLocaleString('en-IN', { maximumFractionDigits: 3 }); };
const PCT = n => (Number(n) || 0).toFixed(1) + '%';
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* ---- dates (local, no UTC shift) ---- */
const iso = d => {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
const TODAY = iso(new Date());
const dmy = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return d + '-' + m + '-' + y; };
const dmyShort = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return d + '/' + m; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = s => DAYN[new Date(s + 'T00:00:00').getDay()];
const monthKey = s => String(s).slice(0, 7);
const monthName = s => { const [y, m] = String(s).slice(0, 7).split('-'); return MON[+m - 1] + ' ' + y; };
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const startOfMonth = s => String(s).slice(0, 7) + '-01';
const endOfMonth = s => { const [y, m] = String(s).split('-').map(Number); return iso(new Date(y, m, 0)); };
const fyOf = s => { const [y, m] = String(s).split('-').map(Number); return m >= 4 ? y + '-' + String((y + 1) % 100).padStart(2, '0') : (y - 1) + '-' + String(y % 100).padStart(2, '0'); };
const fyStart = s => { const [y, m] = String(s).split('-').map(Number); return (m >= 4 ? y : y - 1) + '-04-01'; };

/* ---- ids ---- */
let _idc = 0;
const uid = p => (p || 'x') + '_' + Date.now().toString(36).slice(-5) + (_idc++).toString(36);

/* ---- SAFE FORMULA EVALUATOR (Tally-jaisa chhota formula engine) ----
   Support: + - * / ( ) numbers, aur variables (base, yq, qty, rate, cost).
   "12%" ka matlab base ka 12% (sirf percent-only expression).          */
function evalExpr(expr, vars) {
  vars = vars || {};
  if (typeof expr === 'number') return isFinite(expr) ? expr : 0;
  if (expr == null) return 0;
  let s = String(expr).trim();
  if (!s) return 0;
  const pctOnly = s.match(/^(\d*\.?\d+)\s*%$/);
  if (pctOnly) return (Number(vars.base) || 0) * Number(pctOnly[1]) / 100;
  s = s.replace(/,/g, '').replace(/₹/g, '');
  if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
  if (!/^[0-9a-zA-Z_+\-*/().\s]+$/.test(s)) return 0;
  let t = s.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, m => {
    if (vars[m] !== undefined && vars[m] !== null && vars[m] !== '') return '(' + (Number(vars[m]) || 0) + ')';
    return '(0)';
  });
  try {
    const v = Function('"use strict";return (' + t + ');')();
    return isFinite(v) ? v : 0;
  } catch (e) { return 0; }
}
const num = (v, vars) => evalExpr(v, vars);

/* ---- amount in words (Indian) ---- */
function inWords(amount) {
  const a = Math.round(Math.abs(Number(amount) || 0));
  if (a === 0) return 'Zero Rupaye';
  const ones = ['', 'Ek', 'Do', 'Teen', 'Chaar', 'Paanch', 'Chhah', 'Saat', 'Aath', 'Nau', 'Das', 'Gyarah', 'Barah', 'Terah', 'Chaudah', 'Pandrah', 'Solah', 'Satrah', 'Atharah', 'Unnis'];
  const tens = ['', '', 'Bees', 'Tees', 'Chalees', 'Pachas', 'Saath', 'Sattar', 'Assi', 'Nabbe'];
  const two = n => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const three = n => { const h = Math.floor(n / 100), rest = n % 100; return (h ? ones[h] + ' Sau' + (rest ? ' ' : '') : '') + (rest ? two(rest) : ''); };
  let out = '';
  const cr = Math.floor(a / 10000000), lk = Math.floor((a % 10000000) / 100000), th = Math.floor((a % 100000) / 1000), rest = a % 1000;
  if (cr) out += three(cr) + ' Crore ';
  if (lk) out += three(lk) + ' Lakh ';
  if (th) out += three(th) + ' Hazaar ';
  if (rest) out += three(rest);
  return out.trim() + ' Rupaye';
}

/* ---- toast ---- */
function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  $('#toastRoot').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 320); }, 2600);
}

/* ---- generic form modal ---- */
function fieldHTML(f, values) {
  const v = values[f.key] !== undefined && values[f.key] !== null ? values[f.key] : (f.value !== undefined ? f.value : '');
  const cls = 'field' + (f.full ? ' full' : '') + (f.gold ? ' gold' : '');
  let inner;
  if (f.type === 'select') {
    inner = '<select name="' + f.key + '"' + (f.attrs || '') + '>' +
      (f.options || []).map(o => {
        const val = typeof o === 'object' ? o.value : o;
        const lab = typeof o === 'object' ? o.label : o;
        return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(lab) + '</option>';
      }).join('') + '</select>';
  } else if (f.type === 'textarea') {
    inner = '<textarea name="' + f.key + '" rows="' + (f.rows || 2) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(v) + '</textarea>';
  } else if (f.type === 'check') {
    return '<div class="' + cls + '"><label class="check"><input type="checkbox" name="' + f.key + '" value="1"' + (v ? ' checked' : '') + '> ' + esc(f.label) + '</label>' + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
  } else {
    /* mobile keyboard: number wale field pe numeric keypad */
    const numLabel = /₹|amount|price|rate|qty|qty|days|month|stock|%|pct|cost|limit|emi|tenure|opening|disc|salary|hours|gst/i.test(f.label || '');
    const im = f.inputmode || (f.type === 'number' || (f.type !== 'date' && numLabel) ? 'decimal' : '');
    inner = '<input type="' + (f.type || 'text') + '" name="' + f.key + '" value="' + esc(v) + '"' +
      (f.step ? ' step="' + f.step + '"' : (f.type === 'number' ? ' step="any"' : '')) +
      (im ? ' inputmode="' + im + '"' : '') +
      (f.type === 'email' ? ' autocapitalize="off" autocomplete="email"' : '') +
      (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
      (f.attrs || '') + '>';
  }
  return '<div class="' + cls + '"><label>' + esc(f.label) + '</label>' + inner + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
}

function closeModal() { $('#modalRoot').innerHTML = ''; }

/* mobile keyboard: numeric fields pe number pad */
function upgradeInputs(root) {
  try {
    const scope = root || document;
    const list = scope.querySelectorAll ? scope.querySelectorAll('input[type=text],input:not([type])') : [];
    Array.prototype.forEach.call(list, el => {
      const tag = ((el.id || '') + ' ' + (el.name || '') + ' ' + (el.className || '') + ' ' + (el.getAttribute('placeholder') || '')).toLowerCase();
      if (!el.getAttribute('inputmode') && /qty|rate|amount|amt|price|disc|pct|stock|day|cost|emi|salary|hour|limit|opening|tenure|num/.test(tag)) el.setAttribute('inputmode', 'decimal');
      if (/phone|mobile|pin|gstin/.test(tag)) { el.setAttribute('autocomplete', 'off'); if (/phone|mobile/.test(tag)) el.setAttribute('inputmode', 'tel'); }
      if (/^text$/i.test(el.type || '') && /name|party|product|note|reason|address|area|label|title/i.test(tag)) el.setAttribute('autocapitalize', 'words');
    });
  } catch (e) {}
}
/* desktop par hi auto-focus — phone pe keyboard apne aap na khule */
function finePointer() {
  try { return !window.matchMedia || window.matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) { return true; }
}

function openModal(opts) {
  /* opts: {title, sub, body, foot, width} */
  $('#modalRoot').innerHTML =
    '<div class="modal-back"><div class="modal" style="max-width:' + (opts.width || 720) + 'px">' +
      '<div class="modal-head"><div><h3>' + (opts.title || '') + '</h3>' + (opts.sub ? '<div class="sub">' + opts.sub + '</div>' : '') + '</div>' +
        '<button class="x" data-act="closeModal" type="button">✕</button></div>' +
      '<div class="modal-body">' + opts.body + '</div>' +
      (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') +
    '</div></div>';
  upgradeInputs($('#modalRoot'));
  const first = $('#modalRoot input, #modalRoot select, #modalRoot textarea');
  if (first && opts.focus !== false && finePointer()) setTimeout(() => { try { first.focus(); } catch (e) {} }, 40);
}

/* standard single-record form */
function openForm(o) {
  const vals = o.values || {};
  const body = '<form id="stdForm" autocomplete="off"><div class="fields">' +
    (o.fields || []).map(f => fieldHTML(f, vals)).join('') + '</div>' + (o.extraHTML || '') + '</form>';
  openModal({
    title: o.title, sub: o.sub, body: body,
    foot: '<button class="btn" type="button" data-act="closeModal">Cancel</button>' +
      '<button class="btn primary" type="button" id="stdSubmit">' + (o.submit || 'Save') + '</button>'
  });
  const go = () => {
    const form = $('#stdForm');
    const data = {};
    Array.from(form.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === 'checkbox') data[el.name] = el.checked ? 1 : 0;
      else data[el.name] = el.value;
    });
    const keep = o.onSubmit(data);
    if (keep === false) return;
    closeModal(); render();
  };
  $('#stdSubmit').onclick = go;
  $('#stdForm').onsubmit = e => { e.preventDefault(); go(); };
  $('#stdForm').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); go(); } });
}

/* confirm helper */
function confirmBox(msg, onYes, yesLabel) {
  openModal({
    title: 'Confirm karein', width: 440,
    body: '<p style="font-size:13.2px;color:#42526b">' + msg + '</p>',
    foot: '<button class="btn" data-act="closeModal">Nahi</button>' +
      '<button class="btn primary" id="cfYes">' + (yesLabel || 'Haan, karo') + '</button>'
  });
  $('#cfYes').onclick = () => { closeModal(); onYes(); };
}

/* ---- table builder ---- */
function tableHTML(cols, rows, opts) {
  opts = opts || {};
  if (!rows || !rows.length) {
    return '<div class="empty"><b>' + (opts.emptyTitle || 'Koi record nahi') + '</b>' + (opts.empty || 'Naya entry add karein.') + '</div>';
  }
  const head = '<tr>' + cols.map(c => '<th class="' + (c.cls || '') + '">' + c.label + '</th>').join('') + '</tr>';
  const body = rows.map(r => '<tr' + (r.__cls ? ' class="' + r.__cls + '"' : '') + '>' +
    cols.map(c => '<td class="' + (c.cls || '') + '">' + (c.render ? c.render(r) : esc(r[c.key])) + '</td>').join('') + '</tr>').join('');
  const foot = opts.foot ? '<tfoot>' + opts.foot + '</tfoot>' : '';
  return '<div class="tbl-wrap"><table class="tbl ' + (opts.compact ? 'compact' : '') + '"><thead>' + head + '</thead><tbody>' + body + '</tbody>' + foot + '</table></div>';
}

/* ---- chart: bar chart ---- */
function barChart(points, o) {
  o = o || {};
  const w = o.width || 760, h = o.height || 170, pad = { t: 12, r: 8, b: 22, l: 8 };
  if (!points.length) return '<div class="empty" style="padding:20px">Data nahi</div>';
  const max = Math.max.apply(null, points.map(p => p.value).concat([1]));
  const iw = (w - pad.l - pad.r) / points.length;
  const bw = Math.max(4, Math.min(26, iw * 0.62));
  let bars = '', labels = '';
  points.forEach((p, i) => {
    const x = pad.l + i * iw + (iw - bw) / 2;
    const bh = Math.max(2, (h - pad.t - pad.b) * (p.value / max));
    const y = h - pad.b - bh;
    const fill = p.color || '#2f6ea5';
    bars += '<g><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3" fill="' + fill + '" opacity="' + (p.dim ? .35 : .92) + '"><title>' + esc(p.label) + ': ' + INR0(p.value) + '</title></rect></g>';
    if (points.length <= 32 || i % Math.ceil(points.length / 16) === 0) {
      labels += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="#7b8a9e" text-anchor="middle">' + esc(p.short || p.label) + '</text>';
    }
  });
  return '<div class="chartbox"><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:' + h + 'px">' +
    '<line x1="0" y1="' + (h - pad.b) + '" x2="' + w + '" y2="' + (h - pad.b) + '" stroke="#e3e9f1"/>' + bars + labels + '</svg></div>';
}

/* ---- donut / stacked share bar ---- */
function shareBar(segs) {
  const total = segs.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  return '<div class="tracker">' + segs.map(s =>
    '<i style="width:' + (Math.max(0, s.value) / total * 100).toFixed(2) + '%;background:' + s.color + '" title="' + esc(s.label) + '"></i>'
  ).join('') + '</div>';
}

/* ---- icons ---- */
const IC = {
  dash: '<rect x="3" y="3" width="7.5" height="8" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.6"/><rect x="3" y="14" width="7.5" height="7" rx="1.6"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.6"/>',
  bread: '<path d="M4 11.5c0-3.6 3.2-6 8-6s8 2.4 8 6V18a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18z"/><path d="M8 9.5V18M12 8.5V19M16 9.5V18"/>',
  oven: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.4h.01M10 6.4h.01"/><rect x="6.5" y="12" width="11" height="5" rx="1"/>',
  bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9.5 8h5M9.5 12h5"/>',
  shop: '<path d="M4 9.5V20h16V9.5"/><path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-5 1 3 3 0 0 1-5 0 3 3 0 0 1-5-1z"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 11h11l2-8H6"/>',
  truck: '<path d="M2.5 6.5h10v10h-10z"/><path d="M12.5 10h4l3 3v3.5h-7z"/><circle cx="6.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/>',
  money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
  expense: '<path d="M12 3v18"/><path d="M16.5 7.5c0-1.9-2-3-4.5-3s-4.5 1.1-4.5 3 2 2.6 4.5 3.2 4.5 1.2 4.5 3.3-2 3-4.5 3-4.5-1.2-4.5-3"/>',
  staff: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 20c0-2.4-.8-4.2-2.2-5.3"/>',
  chart: '<path d="M3.5 20V4"/><path d="M3.5 20h17"/><rect x="6.5" y="12" width="3.2" height="5"/><rect x="11.5" y="8" width="3.2" height="9"/><rect x="16.5" y="5" width="3.2" height="12"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14.5 2.6A9 9 0 0 1 21.4 9.5h-6.9z"/>',
  ledger: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M8 8h7M8 12h7M8 16h4"/>',
  stock: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  gst: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 9.5h.01M15 15.5h.01M8.5 16l7-8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/>',
  dashlet: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'
};
const icon = (k, size) => '<svg viewBox="0 0 24 24" width="' + (size || 17) + '" height="' + (size || 17) + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (IC[k] || IC.dashlet) + '</svg>';
