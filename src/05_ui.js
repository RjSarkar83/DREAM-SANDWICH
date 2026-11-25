/* ================= DREAM SANDWICH — NAV / ROUTER / SHARED UI ================= */
const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dash', views: ['dashboard'] },
  {
    id: 'daily', label: 'Per Day', icon: 'bill', views: ['dailyRegister', 'dailyNeeded', 'planNext', 'cashBook'],
    tabs: { dailyRegister: 'Day Register', dailyNeeded: 'Kya Chahiye', planNext: 'Kal ka Plan', cashBook: 'Cash Book' }
  },
  {
    id: 'bakery', label: 'Bakery', icon: 'bread', views: ['bakeryProducts', 'bakeryProduction', 'bakeryBatch', 'bakerySales'],
    tabs: { bakeryProducts: 'Recipe & Cost', bakeryProduction: 'Production', bakeryBatch: 'Batch / Expiry', bakerySales: 'Sales' }
  },
  {
    id: 'store', label: 'Store / Stall', icon: 'cart', views: ['storeSales', 'storePurchase', 'storePO', 'vendorPay', 'storeWastage'],
    tabs: { storeSales: 'Counter Sales', storePurchase: 'Purchase & Stock', storePO: 'Purchase Orders', vendorPay: 'Vendor Payment', storeWastage: 'Wastage & Adjust' }
  },
  {
    id: 'supply', label: 'Marketing Supply', icon: 'truck', views: ['supplyOrderBook', 'supplyOrders', 'supplyDemand', 'supplyPayments'],
    tabs: { supplyOrderBook: 'Orders', supplyOrders: 'Supply Bills', supplyDemand: 'Demand', supplyPayments: 'Payments' }
  },
  {
    id: 'bahi', label: 'Bahi Khata', icon: 'ledger', views: ['bahiKhata', 'trialBalance', 'reportDaybook'],
    tabs: { bahiKhata: 'Khata / Ledger', trialBalance: 'Trial Balance', reportDaybook: 'Day Book' }
  },
  {
    id: 'reports', label: 'Reports', icon: 'chart', views: ['reportPnl', 'reportProduct', 'reportParty', 'reportStock', 'reportGst', 'reportGstr1', 'reportAgeing', 'reportReminders'],
    tabs: { reportPnl: 'Profit & Loss', reportProduct: 'Product P&L', reportParty: 'Udhaar / Party', reportAgeing: 'Ageing', reportStock: 'Stock', reportGst: 'GST', reportGstr1: 'GSTR-1 / HSN', reportReminders: 'Reminders' }
  },
  {
    id: 'accounts', label: 'Expenses & Staff', icon: 'expense', views: ['expenses', 'monthlyExpenses', 'staff', 'attendance', 'assets'],
    tabs: { expenses: 'Expenses', monthlyExpenses: 'Month-wise', staff: 'Staff & Salary', attendance: 'Attendance', assets: 'Assets & EMI' }
  },
  {
    id: 'masters', label: 'Masters', icon: 'gear', views: ['setup', 'ingredients', 'partyRates', 'labels', 'imports', 'settings'],
    tabs: { setup: 'Setup / Start', ingredients: 'Ingredients & Rate', partyRates: 'Party Rate List', labels: 'Labels', imports: 'Import', settings: 'Settings & Backup' }
  }
];

const VIEWS = {
  dashboard: { render: viewDashboard },
  dailyRegister: { render: viewDaily },
  dailyNeeded: { render: viewNeeded },
  monthlyExpenses: { render: viewMonthlyExpenses },
  cashBook: { render: viewCashBook },
  partyRates: { render: viewPartyRates },
  bakeryBatch: { render: viewBatch },
  reportReminders: { render: viewReminders },
  attendance: { render: viewAttendance },
  storePO: { render: viewPurchaseOrders },
  reportAgeing: { render: viewAgeing },
  vendorPay: { render: viewVendorPay },
  planNext: { render: viewPlanNext },
  reportGstr1: { render: viewGstr1 },
  labels: { render: viewLabels },
  imports: { render: viewImport },
  assets: { render: viewAssets },
  bakeryProducts: { render: viewBakeryProducts },
  bakeryProduction: { render: viewProduction },
  bakerySales: { render: () => viewSales('bakery') },
  storeSales: { render: () => viewSales('store') },
  storePurchase: { render: viewPurchases },
  supplyOrderBook: { render: viewOrderBook },
  supplyOrders: { render: () => viewSales('supply') },
  supplyDemand: { render: viewDemand },
  storeWastage: { render: viewWastage },
  setup: { render: viewSetup },
  supplyPayments: { render: viewPayments },
  bahiKhata: { render: viewBahiKhata },
  trialBalance: { render: viewTrialBalance },
  expenses: { render: viewExpenses },
  staff: { render: viewStaff },
  reportPnl: { render: viewReportPnl },
  reportProduct: { render: viewReportProduct },
  reportParty: { render: viewReportParty },
  reportStock: { render: viewReportStock },
  reportDaybook: { render: viewReportDaybook },
  reportGst: { render: viewReportGst },
  ingredients: { render: viewIngredients },
  settings: { render: viewSettings }
};

let current = 'dashboard';
const sectionOf = v => SECTIONS.find(s => s.views.indexOf(v) > -1) || SECTIONS[0];

function renderNav() {
  const active = sectionOf(current).id;
  const allowed = (typeof SESSION !== 'undefined' && SESSION.role === 'counter') ? ROLE_OK : null;
  const list = allowed ? SECTIONS.filter(s => allowed.indexOf(s.id) > -1) : SECTIONS;
  $('#nav').innerHTML = list.map(s =>
    '<button class="nav-item' + (active === s.id ? ' active' : '') + '" data-act="nav" data-view="' + s.views[0] + '">' +
    icon(s.icon) + '<span>' + s.label + '</span></button>'
  ).join('');
}

function tabBar(sec) {
  if (!sec.tabs) return '';
  return '<div class="tabsbar">' + sec.views.map(v =>
    '<button class="tab' + (current === v ? ' active' : '') + '" data-act="tab" data-view="' + v + '">' +
    (sec.tabs[v] || v) + '</button>'
  ).join('') + '</div>';
}

function render() {
  if (typeof SESSION !== 'undefined' && SESSION.role === 'counter' && ROLE_OK.indexOf(sectionOf(current).id) < 0) current = 'dashboard';
  const view = VIEWS[current] || VIEWS.dashboard;
  const sec = sectionOf(current);
  $('#view').innerHTML = tabBar(sec) + view.render();
  renderNav();
  const m = DB.meta;
  $('#compName').textContent = m.company || 'Dream Sandwich';
  $('#compMeta').textContent = periodLabel();
  $('#fyLabel').textContent = m.fy || fyOf(TODAY);
  syncPeriodInputs();
  if ($('#lockBtn')) $('#lockBtn').style.display = (typeof pinOn === 'function' && pinOn()) ? 'inline-flex' : 'none';
  if (view.after) view.after();
  if (typeof syncSidebar === 'function') syncSidebar();
  if (typeof upgradeInputs === 'function') upgradeInputs($('#view'));
}

/* ---------- shared building blocks ---------- */
const tile = (label, val, foot, cls) =>
  '<div class="tile ' + (cls ? 't-' + cls : '') + '"><div class="label">' + label + '</div><div class="val">' + val + '</div>' +
  (foot ? '<div class="foot">' + foot + '</div>' : '') + '</div>';

const card = (title, sub, actions, body, opts) =>
  '<div class="card ' + ((opts && opts.cls) || '') + '">' +
  (title || actions ? '<div class="card-head"><div><h3>' + title + '</h3>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="spacer"></div>' + (actions || '') + '</div>' : '') +
  '<div class="card-body ' + ((opts && opts.tight) ? 'tight' : '') + '">' + body + '</div></div>';

const pageHead = (title, sub, actions) =>
  '<div class="rep-title"><div><h2>' + title + '</h2><p>' + sub + '</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">' + (actions || '') + '</div></div>';

const chTag = ch => '<span class="badge b-' + (ch === 'bakery' ? 'amber' : ch === 'store' ? 'teal' : 'indigo') + '">' + (VLABEL[ch] || ch) + '</span>';
const payTag = m => m === 'credit' ? '<span class="badge b-red">Udhaar</span>' : m === 'upi' ? '<span class="badge b-grey">UPI</span>' : '<span class="badge b-green">Cash</span>';

/* ---------- mobile drawer (sidebar) ---------- */
const MOBILE_NAV = () => window.innerWidth <= 1000;
function syncSidebar() {
  const sb = $('#sidebar'), sc = $('#scrim'), hb = $('.hamburger');
  const open = !!(sb && sb.classList.contains('open'));
  if (sc) { sc.classList.toggle('show', open); sc.setAttribute('aria-hidden', open ? 'false' : 'true'); }
  if (document.body) document.body.classList.toggle('nav-open', open);
  if (hb) { hb.setAttribute('aria-expanded', open ? 'true' : 'false'); hb.textContent = open ? '✕' : '☰'; }
  if (sb) sb.setAttribute('aria-hidden', open || !MOBILE_NAV() ? 'false' : 'true');
}
function scrollTop() {
  try {
    window.scrollTo(0, 0);
    const v = $('#view'); if (v) v.scrollTop = 0;
    const d = document.documentElement; if (d) d.scrollTop = 0;
    const b = document.body; if (b) b.scrollTop = 0;
  } catch (e) {}
}
function openSidebar() { const sb = $('#sidebar'); if (!sb) return; sb.classList.add('open'); syncSidebar(); }
function closeSidebar() {
  const sb = $('#sidebar'); if (!sb || !sb.classList.contains('open')) { syncSidebar(); return; }
  sb.classList.remove('open'); syncSidebar();
}

/* ---------- global actions ---------- */
const ACT = {
  nav: d => { current = d.view; closeSidebar(); render(); scrollTop(); },
  tab: d => { current = d.view; render(); scrollTop(); },
  closeModal: () => closeModal(),
  closeSidebar: () => closeSidebar(),
  openSidebar: () => openSidebar(),
  toggleSidebar: () => { const sb = $('#sidebar'); if (!sb) return; sb.classList.contains('open') ? closeSidebar() : openSidebar(); },
  periodChange: el => { const m = el.value; if (m === 'custom') return; applyPeriod(m); render(); },
  periodDate: () => {
    const f = $('#fromDate').value, t = $('#toDate').value;
    if (!f || !t) return;
    P.from = f; P.to = t; P.mode = 'custom';
    $('#periodSel').value = 'custom';
    render();
  },
  quickSale: () => saleModal('bakery'),
  quickExpense: () => expenseModal(),
  quickPurchase: () => purchaseModal()
};
document.addEventListener('click', e => {
  /* modal ke bahar tap/click -> band */
  if (e.target && e.target.classList && e.target.classList.contains('modal-back')) { closeModal(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.tagName === 'SELECT' || el.type === 'date') return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
  /* mobile drawer: koi bhi nav item chunein -> drawer band */
  if (MOBILE_NAV() && (el.dataset.act === 'nav' || el.dataset.act === 'tab' || el.closest('#nav'))) closeSidebar();
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn && (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'date'))) { fn(el.dataset, el); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const modal = $('#modalRoot');
  if (modal && modal.innerHTML.trim()) { closeModal(); return; }
  closeSidebar();
});

/* resize / rotate: bade screen pe drawer khula na rahe */
let __navRz;
window.addEventListener('resize', () => {
  clearTimeout(__navRz);
  __navRz = setTimeout(() => { if (!MOBILE_NAV()) closeSidebar(); else syncSidebar(); }, 120);
});
window.addEventListener('orientationchange', () => setTimeout(syncSidebar, 220));
