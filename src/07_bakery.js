/* ================= BAKERY: PRODUCTS, RECIPE, PRODUCTION ================= */
const GST_OPTS = [{ value: 0, label: '0% (GST nahi)' }, { value: 5, label: '5%' }, { value: 12, label: '12%' }, { value: 18, label: '18%' }, { value: 28, label: '28%' }];

function viewBakeryProducts() {
  const rows = DB.products.slice().sort((a, b) => {
    const ma = a.autoPrice ? 0 : 1, mb = b.autoPrice ? 0 : 1;
    return ma - mb || a.name.localeCompare(b.name);
  });
  const pl = productPL(P.from, P.to);
  const best = pl.slice().sort((a, b) => b.marginPct - a.marginPct)[0];
  const avgMargin = pl.length ? pl.reduce((a, r) => a + r.marginPct, 0) / pl.length : 0;
  const fg = finishedStock();

  return pageHead('Products, Recipe & Costing', 'Har product ka ingredient-wise cost formula se nikala gaya hai',
      '<button class="btn" data-act="nav" data-view="ingredients">Ingredient rates</button>' +
      '<button class="btn" data-act="newCombo">+ Combo</button>' +
      '<button class="btn gold" data-act="newProduct">+ Naya Product</button>') +

    '<div class="kpis mb">' +
      tile('Total Products', DB.products.length, '<span>Aur ' + DB.ingredients.length + ' ingredients</span>', 'navy') +
      tile('Average Margin', PCT(avgMargin), '<span>Sale huye products ka avg</span>', 'teal') +
      tile('Best Margin Product', best ? esc(best.name.split(' ')[0]) : '—', best ? '<span class="badge b-green">' + PCT(best.marginPct) + '</span>' : '', 'green') +
      tile('Period ki Sales', INR0(pl.reduce((a, r) => a + r.taxable, 0)), '<span>' + pl.reduce((a, r) => a + r.qty, 0) + ' pcs bika</span>', 'amber') +
    '</div>' +

    card('Product Master — Cost, Price & Margin', 'Cost auto-calculate hota hai recipe se · formula-driven pricing',
      '<span class="badge b-navy">' + rows.length + ' products</span>',
      tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.name) + '</b><div class="tiny muted">' + esc(r.category || '-') + ' · ' + esc(r.unit || 'pc') + '</div>' },
        { label: 'Batch Yield', cls: 'num', render: r => r.costMode === 'purchase' ? '<span class="muted">direct</span>' : QTY((r.recipe || {}).yieldQty) + ' <span class="tiny muted">' + esc(r.unit || 'pc') + '</span>' },
        { label: 'Recipe Items', cls: 'num', render: r => r.costMode === 'purchase' ? '—' : ((r.recipe || {}).lines || []).length },
        { label: 'Cost / pc', cls: 'num', render: r => '<b>' + INR(productCost(r).perPc) + '</b>' },
        { label: 'Selling Price', cls: 'num', render: r => INR(priceOf(r)) + (r.autoPrice ? ' <span class="tag-inline">auto</span>' : '') },
        { label: 'Bulk / Supply Rate', cls: 'num', render: r => INR(supplyRateOf(r)) },
        { label: 'Profit / pc', cls: 'num', render: r => { const pf = priceOf(r) - productCost(r).perPc; return '<span class="' + (pf >= 0 ? 'pos' : 'neg') + '">' + INR(pf) + '</span>'; } },
        { label: 'Margin', cls: 'num', render: r => { const c = productCost(r).perPc, pr = priceOf(r); const m = pr ? (pr - c) / pr * 100 : 0; return '<span class="badge b-' + (m >= 25 ? 'green' : m >= 10 ? 'amber' : 'red') + '">' + PCT(m) + '</span>'; } },
        { label: 'FG Stock', cls: 'num', render: r => QTY(Math.max(0, fg[r.id] || 0)) },
        {
          label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
            '<button class="btn sm" data-act="editRecipe" data-id="' + r.id + '">Recipe</button>' +
            '<button class="btn sm danger" data-act="delProduct" data-id="' + r.id + '">✕</button></div>'
        }
      ], rows, { compact: true, emptyTitle: 'Koi product nahi' }), { tight: true }) +

    '<div class="mt">' + card('Costing Formula (kaise nikla jata hai)', 'Isko samajhne ke baad aap koi bhi rate badal kar turant naya cost dekh sakte hain', '',
      '<div class="formula">' +
        '<div><b>Cost / pc</b> = <span class="w">(</span> Σ (ingredient qty × rate) ÷ yield ÷ (1 − wastage%) <span class="w">)</span></div>' +
        '<div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + (labour + overhead) ÷ yield + packaging/pc</div>' +
        '<div><b>Selling price</b> = <span class="w">(auto)</span> Cost/pc × (1 + markup%) → round up</div>' +
        '<div><b>Gross profit</b> = Sales (GST chhod ke) − Cost of goods sold</div>' +
        '<div><b>Qty formula</b>: recipe me "0.25" ya "8%" (batch base ka %) ya "base*0.02" bhi likh sakte hain</div>' +
      '</div>') + '</div>';
}

/* ---------------- RECIPE / PRODUCT EDITOR ---------------- */
let RP = null;

function recipeModal(pid) {
  const ex = pid ? productById(pid) : null;
  RP = ex ? JSON.parse(JSON.stringify(ex)) : {
    id: uid('pd'), name: '', unit: 'pc', price: 0, bulkPrice: 0, gstPct: 5, category: 'Bakery',
    autoPrice: 1, markupPct: 60, priceRound: 1, costMode: 'recipe',
    recipe: { batchBase: 1, yieldQty: 10, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 2, lines: DB.ingredients.length ? [{ ingId: DB.ingredients[0].id, qty: '1' }] : [] }
  };
  if (!RP.recipe) RP.recipe = { batchBase: 0, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [] };
  if (!RP.recipe.lines) RP.recipe.lines = [];
  drawRecipe();
}

function ingOptions(sel) {
  return DB.ingredients.map(i => '<option value="' + i.id + '"' + (i.id === sel ? ' selected' : '') + '>' + esc(i.name) + ' (' + INR0(i.rate) + '/' + esc(i.unit) + ')</option>').join('');
}

function drawRecipe() {
  const r = RP.recipe;
  const isPurchase = RP.costMode === 'purchase';
  const linesHTML = isPurchase ? '' :
    '<div class="lines-head"><div>Ingredient</div><div>Qty (expr)</div><div>Rate ₹</div><div>Amount</div><div></div></div>' +
    r.lines.map((l, i) => {
      const ing = ingById(l.ingId) || { unit: '', rate: 0 };
      const q = lineQty(l, r);
      return '<div class="linegrid">' +
        '<div class="field"><select class="rpIng" data-i="' + i + '">' + ingOptions(l.ingId) + '</select></div>' +
        '<div class="field"><input type="text" class="rpQty" data-i="' + i + '" value="' + esc(l.qty) + '" placeholder="0.25 ya 8%"></div>' +
        '<div class="field"><input type="text" value="' + r2(ing.rate) + '" readonly style="background:#f8fafc;color:#64748b"></div>' +
        '<div class="field"><input type="text" class="rpAmt" data-i="' + i + '" value="' + r2(q * num(ing.rate)) + '" readonly style="background:#f8fafc"></div>' +
        '<button class="x-btn" data-act="rpDel" data-i="' + i + '">✕</button></div>';
    }).join('') +
    '<button class="btn sm" data-act="rpAdd" style="margin-top:6px">+ Ingredient jodein</button>';

  const body =
    '<div class="fields">' +
      '<div class="field full"><label>Product ka naam</label><input class="rpF" data-k="name" value="' + esc(RP.name) + '" placeholder="jaise: Bread 400g (Loaf)"></div>' +
      '<div class="field"><label>HSN / SAC code</label><input class="rpF" data-k="hsn" value="' + esc(RP.hsn || '') + '" placeholder="1905"></div>' +
      (typeof barcodeFieldHTML === 'function' ? barcodeFieldHTML() : '') +
      '<div class="field"><label>Category</label><select class="rpF" data-k="category">' +
        ['Bakery', 'Cake', 'Store', 'Resale'].map(c => '<option' + (RP.category === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Unit</label><select class="rpF" data-k="unit">' +
        ['pc', 'pack', 'cup', 'box', 'kg'].map(c => '<option' + (RP.unit === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Cost kaise nikle?</label><select class="rpF" data-k="costMode">' +
        '<option value="recipe"' + (isPurchase ? '' : ' selected') + '>Recipe se (ingredient wise)</option>' +
        '<option value="purchase"' + (isPurchase ? ' selected' : '') + '>Direct purchase cost</option></select></div>' +
      (isPurchase
        ? '<div class="field gold"><label>Purchase cost / unit ₹</label><input class="rpF" data-k="purchaseCost" value="' + esc(RP.purchaseCost || 0) + '"></div>'
        : '<div class="field gold"><label>Batch base (kg)</label><input class="rpF" data-k="recipe.batchBase" value="' + esc(r.batchBase) + '"><div class="hint">"%" wale qty isi ka hisaab se lagte hain</div></div>') +
    '</div>' +
    (isPurchase ? '' :
      '<div class="hr"></div><div class="fields">' +
        '<div class="field"><label>Yield (batch se kitne pcs)</label><input class="rpF" data-k="recipe.yieldQty" value="' + esc(r.yieldQty) + '"></div>' +
        '<div class="field"><label>Wastage %</label><input class="rpF" data-k="recipe.wastagePct" value="' + esc(r.wastagePct) + '"></div>' +
        '<div class="field"><label>Labour / batch ₹</label><input class="rpF" data-k="recipe.labourPerBatch" value="' + esc(r.labourPerBatch) + '"></div>' +
        '<div class="field"><label>Overhead / batch ₹ <span class="tiny muted">(gas+bijli)</span></label><input class="rpF" data-k="recipe.overheadPerBatch" value="' + esc(r.overheadPerBatch) + '"></div>' +
        '<div class="field"><label>Packaging / pc ₹</label><input class="rpF" data-k="recipe.packagingPerPc" value="' + esc(r.packagingPerPc) + '"></div>' +
        '<div class="field"><label>Shelf life (din) <span class="tiny muted">expiry</span></label><input class="rpF" data-k="shelfLife" value="' + esc(RP.shelfLife === undefined ? 3 : RP.shelfLife) + '"><div class="hint">batch banne ke kitne din baad expire</div></div>' +
      '</div>' +
      '<div class="hr"></div><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Recipe / Ingredients</div>' +
      linesHTML) +
    '<div class="hr"></div>' +
    '<div class="fields">' +
      '<div class="field"><label class="check"><input type="checkbox" class="rpF" data-k="autoPrice"' + (Number(RP.autoPrice) ? ' checked' : '') + '> Price auto (cost + markup)</label></div>' +
      '<div class="field gold"><label>Markup %</label><input class="rpF" data-k="markupPct" value="' + esc(RP.markupPct) + '"></div>' +
      '<div class="field"><label>Selling price ₹ <span class="tiny muted">(manual)</span></label><input class="rpF" data-k="price" value="' + esc(RP.price) + '"' + (Number(RP.autoPrice) ? ' disabled' : '') + '></div>' +
      '<div class="field"><label>Bulk / supply rate ₹</label><input class="rpF" data-k="bulkPrice" value="' + esc(RP.bulkPrice) + '"></div>' +
      '<div class="field"><label>GST %</label><select class="rpF" data-k="gstPct">' + GST_OPTS.map(g => '<option value="' + g.value + '"' + (Number(RP.gstPct) === g.value ? ' selected' : '') + '>' + g.label + '</option>').join('') + '</select></div>' +
    '</div>' +
    '<div id="rpCalc"></div>';

  openModal({
    title: RP.name ? ('Recipe — ' + esc(RP.name)) : 'Naya Product & Recipe',
    sub: 'Ingredient qty / rate badalte hi cost aur profit turant update hoga',
    body: body, width: 860,
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="rpSave">Product save karein</button>'
  });
  bindRecipe();
  updateRecipeCalc();
}

function readRecipeForm() {
  $$('#modalRoot .rpF').forEach(el => {
    const k = el.dataset.k;
    const v = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
    if (k.indexOf('.') > -1) { const [, sub] = k.split('.'); RP.recipe[sub] = v; }
    else RP[k] = v;
  });
  $$('#modalRoot .rpIng').forEach(el => {
    const i = +el.dataset.i;
    if (RP.recipe.lines[i]) RP.recipe.lines[i].ingId = el.value;
  });
  $$('#modalRoot .rpQty').forEach(el => {
    const i = +el.dataset.i;
    if (RP.recipe.lines[i]) RP.recipe.lines[i].qty = el.value;
  });
}
function bindRecipe() {
  $$('#modalRoot .rpF').forEach(el => {
    const ev = (el.tagName === 'SELECT' || el.type === 'checkbox') ? 'change' : 'input';
    el.addEventListener(ev, () => {
      readRecipeForm();
      if (el.dataset.k === 'costMode' || el.dataset.k === 'autoPrice') { drawRecipe(); return; }
      updateRecipeCalc();
    });
  });
  $$('#modalRoot .rpIng').forEach(el => {
    el.addEventListener('change', () => { readRecipeForm(); updateRecipeCalc(); });
  });
  $$('#modalRoot .rpQty').forEach(el => {
    el.addEventListener('input', () => {
      readRecipeForm();
      const c = productCost(RP);
      $$('#modalRoot .rpAmt').forEach(a => {
        const i = +a.dataset.i;
        const l = c.lines[i];
        if (l) a.value = r2(l.amt);
      });
      updateRecipeCalc();
    });
  });
  $('#rpSave').onclick = () => {
    readRecipeForm();
    if (!RP.name.trim()) { toast('Product ka naam daalein', 'err'); return; }
    const copy = JSON.parse(JSON.stringify(RP));
    ['price', 'bulkPrice', 'markupPct', 'gstPct', 'priceRound', 'autoPrice', 'purchaseCost', 'shelfLife'].forEach(k => { if (copy[k] !== undefined) copy[k] = num(copy[k]); });
    ['batchBase', 'yieldQty', 'labourPerBatch', 'overheadPerBatch', 'packagingPerPc', 'wastagePct'].forEach(k => { copy.recipe[k] = num(copy.recipe[k]); });
    copy.recipe.lines = (copy.recipe.lines || []).map(l => ({ ingId: l.ingId, qty: l.qty }));
    const idx = DB.products.findIndex(p => p.id === copy.id);
    if (idx > -1) DB.products[idx] = copy; else DB.products.push(copy);
    saveDB(); closeModal(); render();
    toast('Product save ho gaya — cost ' + INR(productCost(copy).perPc) + '/pc', 'ok');
  };
}

function updateRecipeCalc() {
  const box = $('#rpCalc');
  if (!box) return;
  const c = productCost(RP);
  const sp = Number(RP.autoPrice) ? suggestedPrice(RP) : num(RP.price);
  const margin = sp ? (sp - c.perPc) / sp * 100 : 0;
  const pf = sp - c.perPc;
  box.innerHTML =
    '<div class="calcbox"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Live Costing</div>' +
    (RP.costMode === 'purchase'
      ? '<div class="cr"><span>Purchase cost</span><b>' + INR(c.perPc) + '</b></div>'
      : '<div class="cr"><span>Ingredient cost (batch)</span><b>' + INR(c.ingr) + '</b></div>' +
        '<div class="cr"><span>+ Labour</span><span>' + INR(c.labour) + '</span></div>' +
        '<div class="cr"><span>+ Overhead (gas / bijli)</span><span>' + INR(c.overhead) + '</span></div>' +
        '<div class="cr"><span>+ Packaging (' + QTY(c.yieldQty) + ' × ' + INR(c.packPerPc) + ')</span><span>' + INR(c.packaging) + '</span></div>' +
        '<div class="cr"><span>Batch cost ÷ yield ' + QTY(c.yieldQty) + ' (wastage ' + PCT(c.wastage) + ')</span><b>' + INR(c.perPc) + '</b></div>') +
    '<div class="cr big"><span>Cost per ' + esc(RP.unit || 'pc') + '</span><span style="color:#0b1f33">' + INR(c.perPc) + '</span></div>' +
    '<div class="cr"><span>Selling price ' + (Number(RP.autoPrice) ? '<span class="tag-inline">auto: cost + ' + num(RP.markupPct) + '%</span>' : '<span class="tag-inline">manual</span>') + '</span><span><b>' + INR(sp) + '</b></span></div>' +
    '<div class="cr big"><span>Profit / pc</span><span class="' + (pf >= 0 ? 'pos' : 'neg') + '">' + INR(pf) + ' (' + PCT(margin) + ')</span></div>' +
    '</div>';
}

/* ---------------- PRODUCTION ---------------- */
function viewProduction() {
  const rows = DB.production.filter(p => p.date >= P.from && p.date <= P.to).slice(0, 60);
  const periodRows = DB.production.filter(p => p.date >= P.from && p.date <= P.to);
  const totalValue = periodRows.reduce((a, r) => a + productCost(productById(r.productId)).perPc * num(r.qty), 0);
  const totalQty = periodRows.reduce((a, r) => a + num(r.qty), 0);
  const todayRows = DB.production.filter(p => p.date === TODAY);
  const fg = finishedStock();

  return pageHead('Production / Batch Entry', 'Batch banate hi raw material stock ghat jata hai aur finished stock badh jata hai',
      '<button class="btn" data-act="nav" data-view="reportStock">Stock dekho</button>' +
      '<button class="btn gold" data-act="newProduction">+ Naya Batch</button>') +

    '<div class="kpis mb">' +
      tile('Aaj ke Batch', todayRows.length, '<span>' + todayRows.reduce((a, r) => a + num(r.qty), 0) + ' pcs bane</span>', 'amber') +
      tile('Period Production', QTY(totalQty) + ' pcs', '<span>' + periodRows.length + ' batch entries</span>', 'navy') +
      tile('Production Value', INR0(totalValue), '<span>Cost ke hisaab se</span>', 'teal') +
      tile('Finished Stock', QTY(DB.products.reduce((a, p) => a + Math.max(0, fg[p.id] || 0), 0)) + ' pcs', '<span>Abhi bikne ko taiyaar</span>', 'green') +
    '</div>' +

    '<div class="grid cols-2-1">' +
    card('Production Entries', 'Ingredients automatically consume hote hain',
      '<span class="badge b-navy">' + rows.length + ' dikha rahe</span>',
      tableHTML([
        { label: 'Date', render: r => dmy(r.date) + ' <span class="tiny muted">' + weekday(r.date) + '</span>' },
        { label: 'Product', render: r => '<b>' + esc((productById(r.productId) || {}).name || '-') + '</b>' + (r.orderId ? ' <span class="tag-inline">order</span>' : '') + (r.isReturn ? ' <span class="badge b-red" style="font-size:9px">RETURN</span>' : '') + (num(r.discPct) > 0 ? ' <span class="tiny muted">' + QTY(r.discPct) + '% off</span>' : '') },
        { label: 'Batches', cls: 'num', render: r => QTY(r.batches) },
        { label: 'Qty', cls: 'num', render: r => '<b>' + QTY(r.qty) + '</b>' },
        { label: 'Cost / pc', cls: 'num', render: r => INR(productCost(productById(r.productId)).perPc) },
        { label: 'Value', cls: 'num', render: r => INR(productCost(productById(r.productId)).perPc * num(r.qty)) },
        { label: '', render: r => '<button class="btn sm danger" data-act="delProduction" data-id="' + r.id + '">✕</button>' }
      ], rows, { compact: true, emptyTitle: 'Is period me production nahi' }), { tight: true }) +
    card('Bana / Bika / Bacha — period ka hisaab', 'Production aur supply ka mel', '',
      (function () {
        const fg = finishedStock();
        const rows = DB.products.map(p => {
          const prod = DB.production.filter(x => x.productId === p.id && x.date >= P.from && x.date <= P.to).reduce((a, x) => a + num(x.qty), 0);
          const sold = DB.sales.filter(x => x.productId === p.id && x.date >= P.from && x.date <= P.to);
          const cnt = sold.filter(s => s.channel === 'bakery').reduce((a, s) => a + num(s.qty), 0);
          const st = sold.filter(s => s.channel === 'store').reduce((a, s) => a + num(s.qty), 0);
          const sup = sold.filter(s => s.channel === 'supply').reduce((a, s) => a + num(s.qty), 0);
          const wst = (DB.wastage || []).filter(w => w.itemType === 'product' && w.itemId === p.id && w.date >= P.from && w.date <= P.to).reduce((a, w) => a + num(w.qty), 0);
          if (!prod && !cnt && !st && !sup && !wst) return null;
          return { p: p, prod: prod, cnt: cnt, st: st, sup: sup, wst: wst, left: Math.max(0, fg[p.id] || 0) };
        }).filter(Boolean);
        if (!rows.length) return '<div class="empty"><b>Is period me koi production/sale nahi</b>Production aur sale entry ke baad yahan bana-bika-bacha dikhega.</div>';
        return tableHTML([
          { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b>' },
          { label: 'Banaya', cls: 'num', render: r => QTY(r.prod) },
          { label: 'Counter', cls: 'num', render: r => QTY(r.cnt) },
          { label: 'Store', cls: 'num', render: r => QTY(r.st) },
          { label: 'Supply', cls: 'num', render: r => QTY(r.sup) },
          { label: 'Wastage', cls: 'num', render: r => r.wst ? '<span class="neg">' + QTY(r.wst) + '</span>' : '—' },
          { label: 'Stock', cls: 'num', render: r => '<b>' + QTY(r.left) + '</b>' }
        ], rows, {
          compact: true,
          foot: '<tr><td>Total</td><td class="num">' + QTY(rows.reduce((a, r) => a + r.prod, 0)) + '</td><td class="num">' + QTY(rows.reduce((a, r) => a + r.cnt, 0)) + '</td>' +
            '<td class="num">' + QTY(rows.reduce((a, r) => a + r.st, 0)) + '</td><td class="num">' + QTY(rows.reduce((a, r) => a + r.sup, 0)) + '</td>' +
            '<td class="num">' + QTY(rows.reduce((a, r) => a + r.wst, 0)) + '</td><td></td></tr>'
        });
      })()) +
    card('Recipe-wise aaj ka plan', 'Har product ka 1 batch kitna deta hai', '',
      tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.name) + '</b>' },
        { label: 'Yield', cls: 'num', render: r => QTY((r.recipe || {}).yieldQty) + ' ' + esc(r.unit) },
        { label: 'Cost', cls: 'num', render: r => INR(productCost(r).perPc) }
      ], DB.products.filter(p => p.costMode !== 'purchase' && p.category !== 'Store'), { compact: true }), { tight: true }) +
    '</div>';
}

function productionModal(opts) {
  opts = opts || {};
  if (!DB.products.length) { toast('Pehle product banayein — Bakery → Recipe & Cost', 'err'); current = 'bakeryProducts'; render(); return; }
  openForm({
    title: 'Naya Production Batch', sub: 'Qty daalein — batch aur ingredient consumption auto nikal jayega', width: 620,
    values: { date: TODAY, productId: opts.productId || DB.products[0].id, qty: opts.qty ? String(Math.ceil(num(opts.qty))) : '' },
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'productId', label: 'Product', type: 'select', options: DB.products.map(p => ({ value: p.id, label: p.name })) },
      { key: 'qty', label: 'Banaye gaye pcs', type: 'text', hint: 'Batch = qty ÷ yield' },
      { key: 'note', label: 'Note (optional)', type: 'text', placeholder: 'subah ka batch' }
    ],
    submit: 'Batch save karein',
    onSubmit: d => {
      const p = productById(d.productId);
      const qty = num(d.qty);
      if (!p || qty <= 0) { toast('Product aur qty sahi daalein', 'err'); return false; }
      const yq = Math.max(0.0001, productCost(p).yieldQty);
      const ing = productCost(p).perPc * qty;
      const bd = d.date || TODAY;
      const life = num(p.shelfLife) || 3;
      const seq = DB.production.filter(x => x.productId === p.id && x.date === bd).length + 1;
      DB.production.push({
        id: uid('pr'), date: bd, productId: p.id, qty: qty, batches: r3(qty / yq),
        batchNo: 'B' + bd.slice(8, 10) + bd.slice(5, 7) + '-' + seq, expiry: addDays(bd, life), note: d.note || ''
      });
      DB.production.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB();
      toast(qty + ' pcs ' + p.name + ' ka batch add hua · expiry ' + dmy(addDays(bd, life)), 'ok');
    }
  });
}

/* ---------------- SALES (bakery / store / supply shared) ---------------- */
function viewSales(channel) {
  const ch = CHANNELS.find(c => c.id === channel) || CHANNELS[0];
  const all = DB.sales.filter(s => s.channel === channel);
  const rows = all.filter(s => s.date >= P.from && s.date <= P.to);
  const amount = rows.reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const tax = rows.reduce((a, s) => a + num(s.qty) * num(s.rate) - num(s.qty) * num(s.rate) / (1 + num(s.gstPct) / 100), 0);
  const cost = rows.reduce((a, s) => a + productCost(productById(s.productId)).perPc * num(s.qty), 0);
  const credit = rows.filter(s => s.payMode === 'credit').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const avgBill = rows.length ? amount / rows.length : 0;
  const prodMap = {};
  rows.forEach(s => prodMap[s.productId] = (prodMap[s.productId] || 0) + num(s.qty));
  const topP = Object.keys(prodMap).sort((a, b) => prodMap[b] - prodMap[a])[0];

  const isSupply = channel === 'supply';
  const show = rows.slice(0, 120);

  return pageHead(ch.label + (isSupply ? ' — Bills & Supply' : ' — ' + ch.sub),
      periodLabel() + ' · ' + rows.length + ' entries' + (isSupply ? ' · GST bill aur udhaar dono manage karein' : ''),
      '<button class="btn" data-act="newReturn">← Return</button>' +
      '<button class="btn" data-act="quickExpense">+ Kharcha</button>' +
      '<button class="btn gold" data-act="newSale" data-ch="' + channel + '">+ Naya ' + (isSupply ? 'Supply Bill' : 'Sale') + '</button>') +

    '<div class="kpis mb">' +
      tile('Sales (GST sahit)', INR0(amount), '<span>GST ' + INR0(tax) + ' included</span>', channel === 'bakery' ? 'amber' : channel === 'store' ? 'teal' : 'indigo') +
      tile('Cost of Goods', INR0(cost), '<span>Recipe cost ke hisaab se</span>', 'red') +
      tile('Gross Profit', INR0(amount - tax - cost), '<span class="badge b-' + (amount - tax - cost >= 0 ? 'green' : 'red') + '">' + PCT(amount - tax ? (amount - tax - cost) / (amount - tax) * 100 : 0) + '</span>', 'green') +
      tile(isSupply ? 'Udhaar diya' : 'Cash + UPI', isSupply ? INR0(credit) : INR0(amount - credit), '<span>' + (isSupply ? 'Party se lena hai' : 'Turant mila') + '</span>', isSupply ? 'red' : 'teal') +
      tile('Average Bill', INR0(avgBill), '<span>' + (topP ? 'Top: ' + esc((productById(topP) || {}).name || '') : '') + '</span>', 'navy') +
    '</div>' +

    card(isSupply ? 'Supply Bills' : 'Sale Entries',
      isSupply ? 'Bill print karke outlet ko dein · udhaar automatically party khate me jata hai' : 'Counter ki daily sales',
      '<input class="btn" style="width:180px;cursor:text" placeholder="Search product / party" oninput="filterSaleRows(this.value)">',
      '<div id="salesTableWrap">' + salesTable(channel, show) + '</div>', { tight: true });
}

function salesTable(channel, rows) {
  const isSupply = channel === 'supply';
  const cols = [
    { label: 'Date', render: r => dmy(r.date) + '<div class="tiny muted">' + weekday(r.date) + '</div>' },
    isSupply ? { label: 'Bill No', render: r => '<span class="mono tiny">' + esc(r.invNo || '-') + '</span>' } : { label: 'Bill', render: r => '<span class="tiny muted">' + r.id.slice(-5) + '</span>' },
    { label: 'Product', render: r => '<b>' + esc((productById(r.productId) || {}).name || '-') + '</b>' + (r.orderId ? ' <span class="tag-inline">order</span>' : '') + (r.isReturn ? ' <span class="badge b-red" style="font-size:9px">RETURN</span>' : '') + (num(r.discPct) > 0 ? ' <span class="tiny muted">' + QTY(r.discPct) + '% off</span>' : '') },
    { label: 'Qty', cls: 'num', render: r => QTY(r.qty) },
    { label: 'Rate', cls: 'num', render: r => INR(r.rate) },
    { label: 'Amount', cls: 'num', render: r => '<b>' + INR(num(r.qty) * num(r.rate)) + '</b>' },
    ...(isSupply ? [{ label: 'Party', render: r => { const p = partyById(r.partyId); return p ? esc(p.name) + '<div class="tiny muted">' + esc(p.area || '') + '</div>' : '<span class="muted">—</span>'; } }] : []),
    { label: 'Mode', render: r => payTag(r.payMode) },
    { label: '', render: r => '<div style="display:flex;gap:5px;justify-content:flex-end">' +
        (isSupply && r.invNo ? thermalBtns(r.invNo) : '') +
        '<button class="btn sm danger" data-act="delSale" data-id="' + r.id + '">✕</button></div>' }
  ];
  const total = rows.reduce((a, r) => a + num(r.qty) * num(r.rate), 0);
  const qtotal = rows.reduce((a, r) => a + num(r.qty), 0);
  return tableHTML(cols, rows, {
    compact: true, emptyTitle: 'Is period me koi entry nahi',
    foot: '<tr><td colspan="3" class="right">Total</td><td class="num">' + QTY(qtotal) + '</td><td></td>' +
      '<td class="num">' + INR(total) + '</td><td colspan="' + (isSupply ? 3 : 2) + '"></td></tr>'
  });
}
function filterSaleRows(q) {
  const wrap = $('#salesTableWrap');
  if (!wrap) return;
  const ch = current === 'supplyOrders' ? 'supply' : current === 'storeSales' ? 'store' : 'bakery';
  const qq = String(q || '').toLowerCase();
  const rows = DB.sales.filter(s => s.channel === ch && s.date >= P.from && s.date <= P.to)
    .filter(s => {
      if (!qq) return true;
      const p = productById(s.productId) || {};
      const pa = partyById(s.partyId) || {};
      return (p.name || '').toLowerCase().includes(qq) || (pa.name || '').toLowerCase().includes(qq) || (s.invNo || '').toLowerCase().includes(qq);
    }).slice(0, 150);
  wrap.innerHTML = salesTable(ch, rows);
}

/* ---------------- SALE ENTRY MODAL ---------------- */
let SL = null;

function saleModal(channel, opts) {
  opts = opts || {};
  if (!DB.products.length) {
    toast('Pehle ek product banayein — Bakery → Recipe & Cost', 'err');
    current = 'bakeryProducts'; render(); return;
  }
  const order = opts.orderId ? (DB.orders || []).find(o => o.id === opts.orderId) : null;
  let lines = [];
  if (order) {
    orderCalc(order);
    (order.lines || []).forEach(l => {
      const pend = r3(num(l.qty) - num(l.supplied || 0));
      if (pend > 0.0001) lines.push({ productId: l.productId, qty: String(pend), rate: l.rate, discPct: 0 });
    });
  }
  if (!lines.length) {
    const p0 = DB.products[0];
    lines = [{ productId: p0.id, qty: '1', rate: rateFor(p0, channel || 'bakery'), discPct: 0 }];
  }
  SL = {
    channel: channel || 'bakery', date: TODAY,
    partyId: opts.partyId || (order ? order.partyId : ''),
    payMode: (channel === 'supply' || order) ? 'credit' : 'cash',
    orderId: order ? order.id : '', agentId: '',
    lines: lines
  };
  drawSale();
}

function prodOptions(sel) {
  return DB.products.map(p => '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('');
}

function drawSale() {
  const isSupply = SL.channel === 'supply';
  const lines = SL.lines.map((l, i) => {
    const p = productById(l.productId) || { name: '-', unit: 'pc' };
    return '<div class="linegrid">' +
      '<div class="field"><select class="slProd" data-i="' + i + '">' + prodOptions(l.productId) + '</select></div>' +
      '<div class="field"><input type="text" class="slQty" data-i="' + i + '" value="' + esc(l.qty) + '"></div>' +
      '<div class="field"><input type="text" class="slRate" data-i="' + i + '" value="' + esc(l.rate) + '"></div>' +
      '<div class="field"><input type="text" class="slDisc" data-i="' + i + '" value="' + esc(l.discPct || '') + '" placeholder="disc %" style="text-align:right"></div>' +
      '<div class="field"><input type="text" class="slAmt" data-i="' + i + '" value="' + r2(lineNet(l)) + '" readonly style="background:#f8fafc"></div>' +
      '<button class="x-btn" data-act="slDel" data-i="' + i + '">✕</button></div>';
  }).join('');

  const body =
    (typeof scanBoxHTML === 'function' ? scanBoxHTML() : '') +
    '<div class="fields">' +
      '<div class="field"><label>Date</label><input type="date" class="slF" data-k="date" value="' + esc(SL.date) + '"></div>' +
      '<div class="field"><label>Channel</label><select class="slF" data-k="channel">' +
        CHANNELS.map(c => '<option value="' + c.id + '"' + (SL.channel === c.id ? ' selected' : '') + '>' + c.label + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Party ' + (isSupply ? '<span class="tiny" style="color:#c02626">*</span>' : '<span class="tiny muted">(optional)</span>') + '</label>' +
        '<select class="slF" data-k="partyId"><option value="">— Counter customer —</option>' +
        outlets().map(o => '<option value="' + o.id + '"' + (SL.partyId === o.id ? ' selected' : '') + '>Outlet · ' + esc(o.name) + (o.area ? ' · ' + esc(o.area) : '') + '</option>').join('') +
        customers().map(o => '<option value="' + o.id + '"' + (SL.partyId === o.id ? ' selected' : '') + '>Customer · ' + esc(o.name) + '</option>').join('') + '</select>' +
        '<div class="hint">Udhaar ke liye party chunna zaroori — naya customer Reports → Udhaar/Party me add karein</div></div>' +
      '<div class="field"><label>Payment</label><select class="slF" data-k="payMode">' +
        '<option value="cash"' + (SL.payMode === 'cash' ? ' selected' : '') + '>Cash</option>' +
        '<option value="upi"' + (SL.payMode === 'upi' ? ' selected' : '') + '>UPI / Bank</option>' +
        '<option value="credit"' + (SL.payMode === 'credit' ? ' selected' : '') + '>Udhaar (credit)</option></select></div>' +
      (agents().length ? '<div class="field"><label>Agent / Delivery <span class="tiny muted">(optional)</span></label><select class="slF" data-k="agentId">' +
        '<option value="">— koi nahi —</option>' + agents().map(a => '<option value="' + a.id + '"' + (SL.agentId === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select></div>' : '') +
    '</div>' +
    (SL.orderId ? '<div class="alert" style="margin-top:10px"><span class="ic">📦</span><div>Order ke against supply — pending qty pehle se bhari hui hai. Bill save karte hi order update ho jayega.</div></div>' : '') +
    '<div class="hr"></div>' +
    '<div class="lines-head"><div>Product</div><div>Qty</div><div>Rate ₹</div><div>Amount</div><div></div></div>' +
    lines +
    '<button class="btn sm" data-act="slAdd" style="margin-top:6px">+ Item jodein</button>' +
    (function () {
      const pt = SL.partyId ? partyById(SL.partyId) : null;
      if (!pt || pt.type === 'vendor' || typeof partyPoints !== 'function' || partyPoints(pt) <= 0) return '';
      return '<div class="field" style="max-width:240px;margin-top:10px"><label>Loyalty points</label>' +
        '<select class="slF" data-k="usePoints"><option value="0"' + (String(SL.usePoints) === '1' ? '' : ' selected') + '>Use nahi</option>' +
        '<option value="1"' + (String(SL.usePoints) === '1' ? ' selected' : '') + '>Use ₹' + r2(partyPoints(pt)) + '</option></select>' +
        '<div class="hint">1 point = ₹1 (max 30% bill)</div></div>';
    })() +
    '<div class="field" style="max-width:240px;margin-top:10px"><label>Bill discount ₹ <span class="tiny muted">(optional)</span></label>' +
      '<input type="text" class="slF" data-k="billDisc" value="' + esc(SL.billDisc || '') + '" placeholder="jaise: 20"></div>' +
    '<div id="slTotals"></div>';

  openModal({
    title: isSupply ? 'Naya Supply / GST Bill' : 'Naya Sale Entry',
    sub: 'Rate auto aata hai product master se — badalna ho to qty/rate edit kar dein', width: 800, body: body,
    foot: '<button class="btn" data-act="closeModal">Cancel</button>' +
      '<button class="btn gold" id="slSave" data-print="0">Save</button>' +
      (isSupply ? '<button class="btn primary" id="slSavePrint" data-print="1">Save + Bill print</button>' : '')
  });
  bindSale();
  updateSaleTotals();
}

function readSaleForm() {
  $$('#modalRoot .slF').forEach(el => SL[el.dataset.k] = el.value);
  $$('#modalRoot .slProd').forEach(el => { const i = +el.dataset.i; if (SL.lines[i]) SL.lines[i].productId = el.value; });
  $$('#modalRoot .slQty').forEach(el => { const i = +el.dataset.i; if (SL.lines[i]) SL.lines[i].qty = el.value; });
  $$('#modalRoot .slRate').forEach(el => { const i = +el.dataset.i; if (SL.lines[i]) SL.lines[i].rate = el.value; });
  $$('#modalRoot .slDisc').forEach(el => { const i = +el.dataset.i; if (SL.lines[i]) SL.lines[i].discPct = el.value; });
}
function bindSale() {
  $$('#modalRoot .slF').forEach(el => el.addEventListener('change', () => {
    readSaleForm();
    if (el.dataset.k === 'channel') {
      SL.lines.forEach(l => { const p = productById(l.productId); if (p) l.rate = partyRate(SL.partyId, p, SL.channel); });
      if (SL.channel === 'supply' && SL.payMode === 'cash') SL.payMode = 'credit';
      drawSale(); return;
    }
    if (el.dataset.k === 'partyId') {
      SL.lines.forEach(l => { const p = productById(l.productId); if (p) l.rate = partyRate(SL.partyId, p, SL.channel); });
      drawSale(); return;
    }
    updateSaleTotals();
  }));
  $$('#modalRoot .slProd').forEach(el => el.addEventListener('change', () => {
    const i = +el.dataset.i;
    const p = productById(el.value);
    if (p && SL.lines[i]) { SL.lines[i].productId = el.value; SL.lines[i].rate = partyRate(SL.partyId, p, SL.channel); }
    readSaleForm(); drawSale();
  }));
  $$('#modalRoot .slQty, #modalRoot .slRate, #modalRoot .slDisc').forEach(el => el.addEventListener('input', () => {
    readSaleForm();
    $$('#modalRoot .slAmt').forEach(a => { const i = +a.dataset.i; const l = SL.lines[i]; if (l) a.value = r2(lineNet(l)); });
    updateSaleTotals();
  }));
  const save = print => {
    readSaleForm();
    const valid = SL.lines.filter(l => l.productId && num(l.qty) > 0);
    if (!valid.length) { toast('Kam se kam ek item daalein', 'err'); return; }
    if (SL.channel === 'supply' && !SL.partyId) { toast('Supply bill ke liye party chunna zaroori hai', 'err'); return; }
    if (SL.payMode === 'credit' && !SL.partyId) { toast('Udhaar ke liye party chunna zaroori hai', 'err'); return; }
    const inv = SL.channel === 'supply' ? nextInvNo() : '';
    const work = valid.map(l => ({ productId: l.productId, qty: num(l.qty), rate: num(l.rate), discPct: num(l.discPct) || 0 }));
    const preTotal = work.reduce((a, l) => a + lineNet(l), 0);
    const ptsUsed = (String(SL.usePoints) === '1' && typeof redeemPoints === 'function') ? redeemPoints(SL.partyId, preTotal) : 0;
    const calc = applyBillRounding(work, num(SL.billDisc) + ptsUsed);
    work.forEach(l => {
      const p = productById(l.productId);
      DB.sales.push({
        id: uid('sl'), date: SL.date || TODAY, channel: SL.channel, productId: l.productId,
        qty: l.qty, rate: l.rate, partyId: SL.partyId || '', payMode: SL.payMode,
        discPct: l.discPct, gstPct: p ? num(p.gstPct) : 0, invNo: inv,
        billDisc: calc.discount || 0, rounded: calc.adjusted ? 1 : 0
      });
    });
    SL.billDisc = '';
    const ptsEarned = (typeof accruePoints === 'function') ? accruePoints(SL.partyId, calc.total) : 0;
    if (ptsUsed || ptsEarned) logAct('Loyalty', (ptsUsed ? 'use ' + ptsUsed + ' ' : '') + (ptsEarned ? 'earn ' + ptsEarned : ''));
    SL.usePoints = '0';
    DB.sales.sort((a, b) => a.date < b.date ? 1 : -1);
    saveDB();
    const amt = calc.total;
    if (SL.payMode === 'credit' && SL.partyId) {
      const pt = partyById(SL.partyId);
      const bal = partyBalance(SL.partyId).receivable;
      if (pt && num(pt.creditLimit) > 0 && bal > num(pt.creditLimit)) {
        toast('⚠️ ' + pt.name + ' ki limit cross: baki ' + INR0(bal) + ' / limit ' + INR0(pt.creditLimit), 'warn');
      }
    }
    toast('Sale saved: ' + INR0(amt) + (inv ? ' · ' + inv : ''), 'ok');
    closeModal();
    if (print && inv) { printInvoice(inv); }
    render();
  };
  $('#slSave').onclick = () => save(false);
  if ($('#slSavePrint')) $('#slSavePrint').onclick = () => save(true);
  if (typeof bindScan === 'function') bindScan();
}

function updateSaleTotals() {
  const box = $('#slTotals');
  if (!box) return;
  let gross = 0, tax = 0, disc = 0;
  SL.lines.forEach(l => {
    const p = productById(l.productId);
    const amt = lineNet(l);
    const raw = num(l.qty) * num(l.rate);
    disc += raw - amt;
    gross += amt;
    const g = p ? num(p.gstPct) : 0;
    tax += amt - amt / (1 + g / 100);
  });
  const billDisc = Math.min(num(SL.billDisc) || 0, gross);
  const afterBill = gross - billDisc;
  const roundTarget = (typeof roundOffOn === 'function' && roundOffOn() && afterBill > 0) ? Math.round(afterBill) : afterBill;
  const roundDiff = r2(roundTarget - afterBill);
  const party = SL.partyId ? partyById(SL.partyId) : null;
  const bal = party ? partyBalance(party.id).receivable : 0;
  box.innerHTML =
    '<div class="calcbox">' +
      '<div class="cr"><span>Total items</span><span>' + SL.lines.filter(l => num(l.qty) > 0).length + '</span></div>' +
      (disc > 0.01 ? '<div class="cr"><span>Item discount</span><span>' + INR(disc) + '</span></div>' : '') +
      (billDisc > 0.01 ? '<div class="cr"><span>Bill discount</span><span>' + INR(billDisc) + '</span></div>' : '') +
      '<div class="cr"><span>Taxable value (GST chhod ke)</span><span>' + INR(gross - tax) + '</span></div>' +
      '<div class="cr"><span>GST (included)</span><span>' + INR(tax) + '</span></div>' +
      (Math.abs(roundDiff) >= 0.01 ? '<div class="cr"><span>Round off</span><span>' + (roundDiff > 0 ? '+' : '') + r2(roundDiff) + '</span></div>' : '') +
      '<div class="cr big"><span>Bill total</span><span>' + INR(roundTarget) + '</span></div>' +
      (party ? '<div class="cr"><span>' + esc(party.name) + ' ka purana udhaar</span><span class="' + (bal > 0 ? 'neg' : '') + '">' + INR(bal) + '</span></div>' : '') +
    '</div>';
}

function nextInvNo() {
  const nums = DB.sales.filter(s => s.invNo).map(s => parseInt(String(s.invNo).split('/').pop(), 10)).filter(n => !isNaN(n));
  const n = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  return (DB.meta.invoicePrefix || 'DS/') + String(n).padStart(4, '0');
}

/* ---------------- INVOICE PRINT ---------------- */
function printInvoice(invNo) {
  const lines = DB.sales.filter(s => s.invNo === invNo);
  if (!lines.length) { toast('Bill nahi mila', 'err'); return; }
  const party = partyById(lines[0].partyId);
  const m = DB.meta;
  let gross = 0, tax = 0;
  const items = lines.map((s, i) => {
    const p = productById(s.productId) || { name: '-', unit: 'pc' };
    const amt = num(s.qty) * num(s.rate);
    const g = num(s.gstPct);
    const taxable = amt / (1 + g / 100);
    gross += amt; tax += amt - taxable;
    return '<tr><td>' + (i + 1) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.unit || 'pc') + '</td>' +
      '<td style="text-align:right">' + QTY(s.qty) + '</td><td style="text-align:right">' + r2(s.rate) + '</td>' +
      '<td style="text-align:right">' + g + '%</td><td style="text-align:right">' + r2(taxable) + '</td>' +
      '<td style="text-align:right">' + r2(amt - taxable) + '</td><td style="text-align:right"><b>' + r2(amt) + '</b></td></tr>';
  }).join('');

  $('#printArea').innerHTML =
    '<div class="inv"><div class="ihead"><div>' +
      '<h1>' + esc(m.company) + '</h1>' +
      '<div style="font-size:11px;color:#444;line-height:1.6">' + esc(m.tagline || '') + '<br>' + esc(m.address) + '<br>' +
      'Phone: ' + esc(m.phone) + '<br><b>GSTIN:</b> ' + esc(m.gstin) + '</div></div>' +
      '<div class="right"><div style="font-size:15px;font-weight:700;letter-spacing:.06em">TAX INVOICE</div>' +
      '<div>No: <b>' + esc(invNo) + '</b></div><div>Date: ' + dmy(lines[0].date) + '</div><div>State: ' + esc(m.state) + '</div>' +
      (typeof barcodeSVG === 'function' ? '<div style="margin-top:6px">' + barcodeSVG(invNo, { height: 38, unit: 1.2 }) + '</div>' : '') + '</div></div>' +
      '<div style="display:flex;gap:16px;margin-top:12px">' +
        '<div style="flex:1;border:1px solid #dbe2ea;padding:8px 10px;border-radius:4px">' +
          '<div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:#666">Bill To</div>' +
          '<div style="font-weight:700;margin-top:2px">' + esc(party ? party.name : 'Counter Customer') + '</div>' +
          '<div style="font-size:11px;color:#444">' + esc(party ? (party.area || '') : '') + (party && party.phone ? '<br>' + esc(party.phone) : '') + '</div></div>' +
        '<div style="flex:1;border:1px solid #dbe2ea;padding:8px 10px;border-radius:4px">' +
          '<div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:#666">Payment</div>' +
          '<div style="font-weight:700;margin-top:2px">' + (lines[0].payMode === 'credit' ? 'Udhaar / Credit' : lines[0].payMode === 'upi' ? 'UPI / Bank' : 'Cash') + '</div>' +
          '<div style="font-size:11px;color:#444">Credit days: ' + (party ? num(party.creditDays) + ' din' : '—') + '</div></div>' +
      '</div>' +
      '<table><thead><tr><th>#</th><th>Item</th><th>Unit</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">GST</th><th style="text-align:right">Taxable</th><th style="text-align:right">GST Amt</th><th style="text-align:right">Total</th></tr></thead>' +
      '<tbody>' + items + '</tbody></table>' +
      '<div class="tot">' +
        (lines.some(s => num(s.discPct) > 0) ? '<div><span>Discount diya</span><span>' + lines.filter(s => num(s.discPct) > 0).map(s => QTY(s.discPct) + '%').join(', ') + '</span></div>' : '') +
        '<div><span>Taxable value</span><span>' + INR(gross - tax) + '</span></div>' +
        '<div><span>CGST</span><span>' + INR(tax / 2) + '</span></div>' +
        '<div><span>SGST</span><span>' + INR(tax / 2) + '</span></div>' +
        '<div class="gr"><span>Grand Total</span><span>' + INR(gross) + '</span></div>' +
        (lines.some(s => num(s.rounded)) ? '<div style="font-size:9.5px;color:#666;text-align:right">Bill total nearest ₹1 me round kiya gaya hai</div>' : '') +
      '</div>' +
      '<div class="words"><b>In words:</b> ' + inWords(gross) + ' only</div>' +
      '<div class="foot"><div>E. &amp; O.E.<br>Samay: ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</div>' +
      '<div style="text-align:right">For <b>' + esc(m.company) + '</b><br><br>___________________<br>Authorised Signatory</div></div>' +
    '</div>';

  try { window.print(); } catch (e) { }
  openModal({
    title: 'Bill preview — ' + esc(invNo), sub: 'Print dialog nahi khula to niche "Print / PDF" dabayein', width: 900,
    body: '<div style="border:1px solid #e3e9f1;border-radius:10px;padding:14px;background:#fff">' + $('#printArea').innerHTML + '</div>',
    foot: '<button class="btn" data-act="closeModal">Band karein</button><button class="btn primary" id="doPrint">🖨 Print / PDF</button>',
    focus: false
  });
  $('#doPrint').onclick = () => { try { window.print(); } catch (e) { toast('Print block hai — file download karke browser me kholein', 'warn'); } };
}

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  newProduct: () => recipeModal(null),
  editRecipe: d => recipeModal(d.id),
  delProduct: d => confirmBox('Ye product delete karna hai? Iski purani sales report me rahengi.', () => {
    DB.products = DB.products.filter(p => p.id !== d.id);
    saveDB(); render(); toast('Product delete ho gaya', 'ok');
  }),
  rpAdd: () => {
    readRecipeForm();
    if (!DB.ingredients.length) { toast('Pehle ingredient add karein (Masters → Ingredients)', 'err'); return; }
    RP.recipe.lines.push({ ingId: DB.ingredients[0].id, qty: '1' }); drawRecipe();
  },
  rpDel: d => { readRecipeForm(); RP.recipe.lines.splice(+d.i, 1); drawRecipe(); },
  newProduction: () => productionModal(),
  delProduction: d => confirmBox('Batch entry delete karein? Stock wapas adjust ho jayega.', () => {
    DB.production = DB.production.filter(p => p.id !== d.id); saveDB(); render(); toast('Entry delete', 'ok');
  }),
  newSale: d => saleModal(d.ch || 'bakery'),
  slAdd: () => {
    readSaleForm();
    const p = DB.products[0];
    SL.lines.push({ productId: p ? p.id : '', qty: '1', rate: p ? partyRate(SL.partyId, p, SL.channel) : 0 });
    drawSale();
  },
  slDel: d => { readSaleForm(); SL.lines.splice(+d.i, 1); if (!SL.lines.length) SL.lines.push({ productId: DB.products[0].id, qty: '1', rate: '' }); drawSale(); },
  delSale: d => confirmBox('Ye sale entry delete karein?', () => {
    DB.sales = DB.sales.filter(s => s.id !== d.id); saveDB(); render(); toast('Entry delete', 'ok');
  }),
  printInv: d => printInvoice(d.inv)
});
