/* ================= FINAL BATCH B: COMBO · TOMORROW PLAN · DAY SUMMARY · GSTR-1 · LABELS · IMPORT ================= */

/* ---------------------------- 1. COMBO PRODUCTS ---------------------------- */
function comboModal(id) {
  const ex = id ? productById(id) : null;
  if (!DB.products.filter(p => !p.combo).length) { toast('Pehle normal product banayein', 'err'); return; }
  let combo = ex && ex.combo ? JSON.parse(JSON.stringify(ex.combo)) : [{ productId: DB.products[0].id, qty: 1 }];
  const draw = () => {
    const lines = combo.map((c, i) => '<div class="linegrid">' +
      '<div class="field"><select class="cbProd" data-i="' + i + '">' + DB.products.filter(p => !p.combo || p.id === exId()).map(p => '<option value="' + p.id + '"' + (p.id === c.productId ? ' selected' : '') + '>' + esc(p.name) + ' (' + INR0(priceOf(p)) + ')</option>').join('') + '</select></div>' +
      '<div class="field"><input type="text" class="cbQty" data-i="' + i + '" value="' + esc(c.qty) + '"></div>' +
      '<button class="x-btn" data-act="cbDel" data-i="' + i + '">✕</button></div>').join('');
    const cost = combo.reduce((a, c) => a + productCost(productById(c.productId)).perPc * num(c.qty), 0);
    const price = num(($('#cbPrice') || {}).value) || num(ex ? ex.price : 0);
    $('#cbLines').innerHTML = lines + '<button class="btn sm" data-act="cbAdd" style="margin-top:6px">+ Item jodein</button>';
    $('#cbCalc').innerHTML = '<div class="calcbox"><div class="cr"><span>Combo cost</span><b>' + INR(cost) + '</b></div>' +
      '<div class="cr"><span>Selling price</span><b>' + INR(price) + '</b></div>' +
      '<div class="cr big"><span>Profit / combo</span><b>' + INR(price - cost) + '</b></div></div>';
  };
  const exId = () => ex ? ex.id : '';
  openModal({
    title: 'Combo / Bundle', sub: 'Do-teen product ek price me — bill par ek line, stock har item ka kategaa', width: 700,
    body: '<div class="fields">' +
        '<div class="field full"><label>Combo ka naam</label><input id="cbName" value="' + esc(ex ? ex.name : '') + '" placeholder="jaise: Sandwich + Cold Drink Combo"></div>' +
        '<div class="field gold"><label>Selling price ₹</label><input id="cbPrice" value="' + esc(ex ? ex.price : '') + '"></div>' +
        '<div class="field"><label>GST %</label><select id="cbGst">' + GST_OPTS.map(g => '<option value="' + g.value + '"' + (ex && Number(ex.gstPct) === g.value ? ' selected' : '') + '>' + g.label + '</option>').join('') + '</select></div>' +
      '</div><div class="hr"></div><div id="cbLines"></div><div id="cbCalc"></div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="cbSave">Save karein</button>'
  });
  draw();
  const read = () => {
    $$('#modalRoot .cbProd').forEach(el => { const i = +el.dataset.i; if (combo[i]) combo[i].productId = el.value; });
    $$('#modalRoot .cbQty').forEach(el => { const i = +el.dataset.i; if (combo[i]) combo[i].qty = el.value; });
  };
  $$('#modalRoot .cbProd').forEach(el => el.addEventListener('change', () => { read(); draw(); }));
  $$('#modalRoot .cbQty').forEach(el => el.addEventListener('input', () => { read(); }));
  $('#cbPrice').addEventListener('input', draw);
  $('#cbSave').onclick = () => {
    read();
    const name = $('#cbName').value.trim();
    const price = num($('#cbPrice').value);
    if (!name || price <= 0) { toast('Naam aur price daalein', 'err'); return; }
    const valid = combo.filter(c => c.productId && num(c.qty) > 0);
    if (!valid.length) { toast('Kam se kam ek item jodein', 'err'); return; }
    const rec = {
      id: ex ? ex.id : uid('pd'), name: name, unit: 'set', price: r2(price), bulkPrice: r2(price * .92),
      gstPct: num($('#cbGst').value), category: 'Combo', autoPrice: 0, markupPct: 0, priceRound: 1,
      costMode: 'combo', shelfLife: 1,
      combo: valid.map(c => ({ productId: c.productId, qty: r3(num(c.qty)) })),
      recipe: { batchBase: 1, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [] }
    };
    const idx = DB.products.findIndex(p => p.id === rec.id);
    if (idx > -1) DB.products[idx] = rec; else DB.products.push(rec);
    saveDB(); closeModal(); render(); toast('Combo saved · ' + rec.name, 'ok');
  };
}

/* ---------------------------- 2. KAL KA PLAN ---------------------------- */
function viewPlanNext() {
  const win = 14, from = addDays(TODAY, -win + 1);
  const pend = pendingByProduct();
  const fg = finishedStock();
  const rows = DB.products.filter(p => p.costMode !== 'purchase' || true).map(p => {
    const sold = DB.sales.filter(s => s.productId === p.id && s.date >= from && s.date <= TODAY).reduce((a, s) => a + num(s.qty), 0);
    const avg = sold / win;
    const pending = pend[p.id] || 0;
    const stock = Math.max(0, fg[p.id] || 0);
    const suggest = Math.max(0, Math.ceil(avg * 1.15 + pending - stock));
    return { p: p, avg: r2(avg), sold: r2(sold), pending: r2(pending), stock: r2(stock), suggest: suggest, cost: suggest * productCost(p).perPc };
  }).filter(r => r.suggest > 0 || r.pending > 0).sort((a, b) => b.suggest - a.suggest);
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalQty = rows.reduce((a, r) => a + r.suggest, 0);

  return pageHead('Kal ka Plan', 'Pichhle 14 din ki sale + pending order — kal kitna banayein',
      '<button class="btn" data-act="printReport" data-title="Kal ka production plan">Print</button>' +
      '<button class="btn primary" data-act="planAll">Sab ka batch banayein</button>') +
    '<div class="kpis mb">' +
      tile('Kal banana hai', QTY(totalQty) + ' pcs', '<span>' + rows.filter(r => r.suggest > 0).length + ' products</span>') +
      tile('Material cost', INR0(totalCost), '<span>approx</span>') +
      tile('Pending order', QTY(Object.keys(pend).reduce((a, k) => a + pend[k], 0)) + ' pcs', '<span>' + Object.keys(pend).length + ' products</span>', 'amber') +
      tile('Average sale/din', QTY(rows.reduce((a, r) => a + r.avg, 0)) + ' pcs', '<span>pichhle ' + win + ' din</span>', 'green') +
    '</div>' +
    card('Suggest kiya hua production', 'Avg daily sale × 1.15 + pending order − stock', '<span class="badge b-grey">' + rows.length + '</span>',
      tableHTML([
        { label: 'Product', render: r => '<b>' + esc(r.p.name) + '</b><div class="tiny muted">' + esc(r.p.category || '') + '</div>' },
        { label: 'Avg/din', cls: 'num', render: r => QTY(r.avg) },
        { label: '14 din sale', cls: 'num', render: r => QTY(r.sold) },
        { label: 'Pending', cls: 'num', render: r => r.pending ? QTY(r.pending) : '—' },
        { label: 'Stock', cls: 'num', render: r => QTY(r.stock) },
        { label: 'Banayein', cls: 'num', render: r => r.suggest ? '<b>' + QTY(r.suggest) + '</b>' : '<span class="pos">theek hai</span>' },
        { label: 'Cost', cls: 'num', render: r => r.suggest ? INR(r.cost) : '—' },
        { label: '', render: r => r.suggest ? '<button class="btn sm" data-act="makeNow" data-id="' + r.p.id + '" data-qty="' + r.suggest + '">+ Batch</button>' : '' }
      ], rows, { compact: true, emptyTitle: 'Suggest karne ke liye sale data nahi' }), { tight: true });
}

/* ---------------------------- 3. DAY SUMMARY (WhatsApp) ---------------------------- */
function daySummaryText(d) {
  const sales = DB.sales.filter(s => s.date === d && !s.isReturn);
  const rets = DB.sales.filter(s => s.date === d && s.isReturn);
  const sup = sales.filter(s => s.channel === 'supply');
  const prod = DB.production.filter(p => p.date === d);
  const waste = (DB.wastage || []).filter(w => w.date === d);
  const cash = DB.sales.filter(s => s.date === d && s.payMode === 'cash').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const upi = DB.sales.filter(s => s.date === d && s.payMode === 'upi').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const credit = DB.sales.filter(s => s.date === d && s.payMode === 'credit').reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const exp = DB.expenses.filter(e => e.date === d).reduce((a, e) => a + num(e.amount), 0);
  const total = sales.reduce((a, s) => a + num(s.qty) * num(s.rate), 0);
  const top = {};
  sales.forEach(s => top[s.productId] = (top[s.productId] || 0) + num(s.qty));
  const topList = Object.keys(top).sort((a, b) => top[b] - top[a]).slice(0, 4)
    .map(k => (productById(k) || {}).name + ' ' + QTY(top[k])).join(', ');
  const outs = outstandingList().reduce((a, o) => a + o.balance, 0);
  return '📊 ' + DB.meta.company + ' — ' + dmy(d) + '\n\n' +
    '💰 Total sale: ₹' + r2(total) + '\n' +
    '   Cash ₹' + r2(cash) + ' · UPI ₹' + r2(upi) + ' · Udhaar ₹' + r2(credit) + '\n' +
    (sup.length ? '🚚 Supply: ₹' + r2(sup.reduce((a, s) => a + num(s.qty) * num(s.rate), 0)) + ' (' + sup.length + ' lines)\n' : '') +
    (rets.length ? '↩️ Return: ₹' + r2(rets.reduce((a, s) => a + num(s.qty) * num(s.rate), 0)) + '\n' : '') +
    '🏭 Banaya: ' + QTY(prod.reduce((a, p) => a + num(p.qty), 0)) + ' pcs\n' +
    (waste.length ? '🗑️ Wastage: ₹' + r2(waste.reduce((a, w) => a + wastageCost(w), 0)) + '\n' : '') +
    '💸 Kharcha: ₹' + r2(exp) + '\n' +
    (topList ? '⭐ Top: ' + topList + '\n' : '') +
    '📌 Kul udhaar baki: ₹' + r2(outs);
}

/* ---------------------------- 4. GSTR-1 / HSN ---------------------------- */
function downloadCSV(name, rows) {
  const csv = rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
  try {
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    toast('CSV download ho gaya', 'ok');
  } catch (e) { copyBox(name, csv); }
}

function gstr1Data(from, to) {
  const rows = DB.sales.filter(s => s.date >= from && s.date <= to && num(s.qty) !== 0);
  const b2b = {}, b2c = {}, hsn = {};
  let totTax = 0;
  rows.forEach(s => {
    const p = productById(s.productId) || {};
    const party = s.partyId ? partyById(s.partyId) : null;
    const g = num(s.gstPct);
    const amt = num(s.qty) * num(s.rate);
    const taxable = amt / (1 + g / 100);
    const tax = amt - taxable;
    totTax += tax;
    const isB2B = !!(party && party.type === 'outlet' && s.invNo);
    const bucket = isB2B ? b2b : b2c;
    bucket[g] = bucket[g] || { rate: g, taxable: 0, tax: 0, count: 0 };
    bucket[g].taxable += taxable; bucket[g].tax += tax; bucket[g].count += 1;
    const h = p.hsn || (p.category || 'OTHER');
    hsn[h] = hsn[h] || { hsn: h, desc: p.name || '', unit: p.unit || 'pc', qty: 0, taxable: 0, tax: 0, rate: g };
    hsn[h].qty += num(s.qty); hsn[h].taxable += taxable; hsn[h].tax += tax;
  });
  return { b2b: Object.values(b2b).sort((a, b) => a.rate - b.rate), b2c: Object.values(b2c).sort((a, b) => a.rate - b.rate), hsn: Object.values(hsn).sort((a, b) => b.taxable - a.taxable), totTax: totTax, lines: rows.length };
}

function viewGstr1() {
  const g = gstr1Data(P.from, P.to);
  const sum = arr => arr.reduce((a, r) => ({ taxable: a.taxable + r.taxable, tax: a.tax + r.tax }), { taxable: 0, tax: 0 });
  const b2bT = sum(g.b2b), b2cT = sum(g.b2c);
  return pageHead('GSTR-1 / HSN Summary', 'CA ko dene ke liye ready summary · ' + periodLabel(),
      '<button class="btn" data-act="exportGstr1">CSV download</button>' +
      '<button class="btn" data-act="printReport" data-title="GSTR-1 summary">Print</button>') +
    '<div class="kpis mb">' +
      tile('B2B (outlet)', INR0(b2bT.taxable), '<span>tax ₹' + INR0(b2bT.tax) + '</span>', 'indigo') +
      tile('B2C (counter)', INR0(b2cT.taxable), '<span>tax ₹' + INR0(b2cT.tax) + '</span>', 'teal') +
      tile('Total GST', INR0(g.totTax), '<span>CGST ' + INR0(g.totTax / 2) + ' + SGST ' + INR0(g.totTax / 2) + '</span>', 'amber') +
      tile('Lines', g.lines, '<span>' + periodLabel() + '</span>') +
    '</div>' +
    '<div class="grid cols-2">' +
      card('Rate wise — B2B', 'GST rate slab', '',
        tableHTML([
          { label: 'Rate', render: r => esc(r.rate) + '%' },
          { label: 'Entries', cls: 'num', render: r => r.count },
          { label: 'Taxable', cls: 'num', render: r => INR(r.taxable) },
          { label: 'CGST', cls: 'num', render: r => INR(r.tax / 2) },
          { label: 'SGST', cls: 'num', render: r => INR(r.tax / 2) }
        ], g.b2b, { compact: true, emptyTitle: 'B2B sale nahi' }), { tight: true }) +
      card('Rate wise — B2C', 'Counter / customer sale', '',
        tableHTML([
          { label: 'Rate', render: r => esc(r.rate) + '%' },
          { label: 'Entries', cls: 'num', render: r => r.count },
          { label: 'Taxable', cls: 'num', render: r => INR(r.taxable) },
          { label: 'CGST', cls: 'num', render: r => INR(r.tax / 2) },
          { label: 'SGST', cls: 'num', render: r => INR(r.tax / 2) }
        ], g.b2c, { compact: true, emptyTitle: 'B2C sale nahi' }), { tight: true }) +
    '</div>' +
    '<div class="mt">' + card('HSN wise summary', 'Product ke HSN code se (Recipe & Cost me set karein)', '<span class="badge b-grey">' + g.hsn.length + '</span>',
      tableHTML([
        { label: 'HSN', render: r => '<b>' + esc(r.hsn) + '</b>' },
        { label: 'Description', render: r => esc(r.desc) },
        { label: 'Unit', render: r => esc(r.unit) },
        { label: 'Qty', cls: 'num', render: r => QTY(r.qty) },
        { label: 'Rate', cls: 'num', render: r => esc(r.rate) + '%' },
        { label: 'Taxable', cls: 'num', render: r => INR(r.taxable) },
        { label: 'Tax', cls: 'num', render: r => INR(r.tax) }
      ], g.hsn, { compact: true, emptyTitle: 'Is period me sale nahi' }), { tight: true }) + '</div>';
}

/* ---------------------------- 5. BARCODE LABELS ---------------------------- */
function viewLabels() {
  const sel = DB.products.slice(0, 6);
  const count = 12;
  const cell = p => '<div style="border:1px dashed #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#fff">' +
    barcodeSVG(prodCode(p), { height: 30, unit: 0.95 }) +
    '<div style="font-size:9.5px;font-weight:700;line-height:1.2">' + esc(String(p.name).slice(0, 26)) + '</div>' +
    '<div style="font-size:11px;font-weight:800">' + INR0(priceOf(p)) + '</div></div>';
  return pageHead('Barcode Labels', 'Sticker print karein — scanner se bill banega',
      '<button class="btn primary" data-act="printReport" data-title="Barcode labels">Labels print</button>') +
    '<div class="kpis mb">' +
      tile('Products', DB.products.length, '<span>' + DB.products.filter(p => !p.barcode).length + ' bina code</span>') +
      tile('Codes ready', DB.products.filter(p => p.barcode).length, '<span>scan billing ke liye</span>', 'green') +
    '</div>' +
    card('Label sheet — 12 stickers', 'Har sticker pe barcode + naam + price', '',
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' + sel.map(cell).join('') + '</div>' +
      '<div class="tiny muted" style="margin-top:10px">Label me barcode product ke code ka hai (product ID ya barcode). Print me paper A4 chunein.</div>');
}

/* ---------------------------- 6. CSV BULK IMPORT ---------------------------- */
function viewImport() {
  return pageHead('Bulk Import (CSV)', 'Ingredients / products / parties ek saath daalein',
      '<button class="btn" data-act="sampleCsv">Sample dikhaen</button>') +
    card('CSV paste karein', 'Har line ek record · comma se column', '',
      '<div class="fields"><div class="field"><label>Kya import karna hai</label><select id="impType">' +
        '<option value="ing">Ingredients — name, unit, rate, minStock, vendor</option>' +
        '<option value="prod">Products — name, unit, price, gst%, cost ₹</option>' +
        '<option value="party">Parties — name, type(outlet/customer/vendor), area, phone, limit</option>' +
      '</select></div></div>' +
      '<textarea id="impBox" style="width:100%;height:170px;font-family:monospace;font-size:12px;padding:9px;border:1px solid #dbe2ea;border-radius:8px" placeholder="maida,kg,42,60,Shree Traders&#10;cheeni,kg,46,25,Shree Traders"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" data-act="doImport">Import karein</button>' +
      '<span class="tiny muted" style="align-self:center">Duplicate naam skip ho jayenge</span></div>');
}

Object.assign(ACT, {
  newCombo: () => comboModal(null),
  editCombo: d => comboModal(d.id),
  planAll: () => {
    const win = 14, from = addDays(TODAY, -win + 1);
    const pend = pendingByProduct(), fg = finishedStock();
    const list = DB.products.map(p => {
      const sold = DB.sales.filter(s => s.productId === p.id && s.date >= from && s.date <= TODAY).reduce((a, s) => a + num(s.qty), 0);
      const suggest = Math.max(0, Math.ceil((sold / win) * 1.15 + (pend[p.id] || 0) - Math.max(0, fg[p.id] || 0)));
      return { p: p, suggest: suggest };
    }).filter(r => r.suggest > 0);
    if (!list.length) { toast('Kuch banane ki zaroorat nahi', 'warn'); return; }
    confirmBox(list.length + ' products ke batch banayein? (' + list.reduce((a, r) => a + r.suggest, 0) + ' pcs)', () => {
      list.forEach(r => {
        const yq = Math.max(0.0001, productCost(r.p).yieldQty);
        const life = num(r.p.shelfLife) || 3;
        const seq = DB.production.filter(x => x.productId === r.p.id && x.date === TODAY).length + 1;
        DB.production.push({
          id: uid('pr'), date: TODAY, productId: r.p.id, qty: r.suggest, batches: r3(r.suggest / yq),
          batchNo: 'B' + TODAY.slice(8, 10) + TODAY.slice(5, 7) + '-' + seq, expiry: addDays(TODAY, life), note: 'Auto plan'
        });
      });
      DB.production.sort((a, b) => a.date < b.date ? 1 : -1);
      saveDB(); render(); toast('Batch ban gaye', 'ok');
    }, 'Batayein');
  },
  daySummary: () => copyBox(DB.meta.company + ' — ' + dmy(DAY) + ' summary', daySummaryText(DAY)),
  exportGstr1: () => {
    const g = gstr1Data(P.from, P.to);
    const rows = [['HSN', 'Description', 'Unit', 'Qty', 'GST%', 'Taxable', 'Tax']]
      .concat(g.hsn.map(r => [r.hsn, r.desc, r.unit, r2(r.qty), r.rate, r2(r.taxable), r2(r.tax)]));
    rows.push([], ['B2B taxable', '', '', '', '', r2(g.b2b.reduce((a, r) => a + r.taxable, 0)), r2(g.b2b.reduce((a, r) => a + r.tax, 0))]);
    rows.push(['B2C taxable', '', '', '', '', r2(g.b2c.reduce((a, r) => a + r.taxable, 0)), r2(g.b2c.reduce((a, r) => a + r.tax, 0))]);
    downloadCSV('gstr1-' + P.from + '-' + P.to + '.csv', rows);
  },
  sampleCsv: () => {
    const t = ($('#impType') || {}).value || 'ing';
    const txt = t === 'ing' ? 'Maida (new),kg,42,60,Shree Traders\nCheeni (new),kg,46,25,Shree Traders'
      : t === 'prod' ? 'Veg Puff,pc,20,5,11\nPaneer Roll,pc,45,5,26'
      : 'New Kirana Store,outlet,MP Nagar,9876500001,10000\nRamesh (customer),customer,Karond,9876500002,2000';
    if ($('#impBox')) $('#impBox').value = txt;
  },
  doImport: () => {
    const type = ($('#impType') || {}).value || 'ing';
    const raw = (($('#impBox') || {}).value || '').trim();
    if (!raw) { toast('CSV paste karein', 'err'); return; }
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0, skipped = 0;
    lines.forEach(line => {
      const c = line.split(',').map(x => x.trim());
      if (type === 'ing') {
        if (!c[0]) return;
        if (DB.ingredients.some(i => i.name.toLowerCase() === c[0].toLowerCase())) { skipped++; return; }
        DB.ingredients.push({ id: uid('ing'), name: c[0], unit: c[1] || 'kg', rate: num(c[2]), minStock: num(c[3]), opening: 0, vendor: c[4] || '' });
        added++;
      } else if (type === 'prod') {
        if (!c[0]) return;
        if (DB.products.some(p => p.name.toLowerCase() === c[0].toLowerCase())) { skipped++; return; }
        DB.products.push({
          id: uid('pd'), name: c[0], unit: c[1] || 'pc', price: num(c[2]), bulkPrice: r2(num(c[2]) * .92), gstPct: num(c[3]) || 5,
          category: 'Resale', autoPrice: 0, markupPct: 0, priceRound: 1, costMode: 'purchase', purchaseCost: num(c[4]),
          shelfLife: 30, barcode: '', recipe: { batchBase: 1, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [] }
        });
        added++;
      } else {
        if (!c[0]) return;
        if (DB.parties.some(p => p.name.toLowerCase() === c[0].toLowerCase())) { skipped++; return; }
        DB.parties.push({ id: uid('o'), name: c[0], type: (c[1] || 'outlet'), area: c[2] || '', phone: c[3] || '', creditDays: 15, creditLimit: num(c[4]), opening: 0 });
        added++;
      }
    });
    saveDB(); render();
    toast(added + ' records import ho gaye' + (skipped ? ' · ' + skipped + ' duplicate skip' : ''), 'ok');
  }
});
