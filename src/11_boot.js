/* ================= BOOT ================= */
(function boot() {
  const saved = loadDB();
  if (saved) {
    DB = saved;
    if (!DB.meta) DB.meta = { company: 'Dream Sandwich' };
    if (!DB.settings) DB.settings = { gstOn: 1 };
  } else {
    DB = emptyDB();
    saveDB();
  }
  if (!DB.agents) DB.agents = [];
  if (!DB.orders) DB.orders = [];
  if (!DB.wastage) DB.wastage = [];
  if (!DB.stockAdj) DB.stockAdj = [];
  if (!DB.agentDeposits) DB.agentDeposits = [];
  if (!DB.attendance) DB.attendance = [];
  if (!DB.advances) DB.advances = [];
  if (!DB.salaryPaid) DB.salaryPaid = [];
  if (!DB.purchaseOrders) DB.purchaseOrders = [];
  if (!DB.vendorPayments) DB.vendorPayments = [];
  if (!DB.writeOffs) DB.writeOffs = [];
  if (!DB.recurring) DB.recurring = [];
  if (!DB.audit) DB.audit = [];
  if (!DB.assets) DB.assets = [];
  if (!DB.loyalty) DB.loyalty = [];
  if (DB.settings && DB.settings.loyaltyPct === undefined) DB.settings.loyaltyPct = 1;
  if (!DB.settings.pins) DB.settings.pins = { owner: '1234', counter: '0000' };
  if (DB.settings.pinOn === undefined) DB.settings.pinOn = 0;
  applyPeriod('month');
  if (isBlankDB(DB)) current = 'setup';
  renderNav();
  render();
  if (typeof gateNeeded === 'function' && gateNeeded()) openGate();
  if (typeof autoSnapshot === 'function') setTimeout(() => autoSnapshot(), 1500);
  if (typeof autoPostRecurring === 'function') { try { autoPostRecurring(); } catch (e) {} }
  if (typeof autoPostAssets === 'function') { try { autoPostAssets(); } catch (e) {} }
  if (typeof syncSidebar === 'function') { try { syncSidebar(); } catch (e) {} }
  if (LS.__memory) {
    setTimeout(() => toast('Preview mode: data sirf is session tak rahega. File download karke browser me kholein for auto-save.', 'warn'), 900);
  }
})();
