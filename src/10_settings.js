/* ================= SETTINGS & BACKUP ================= */
function viewSettings() {
  const m = DB.meta;
  const counts = [
    ['Products', DB.products.length], ['Ingredients', DB.ingredients.length],
    ['Sales entries', DB.sales.length], ['Purchase bills', DB.purchases.length],
    ['Production batches', DB.production.length], ['Expenses', DB.expenses.length],
    ['Payments', DB.payments.length], ['Parties', DB.parties.length]
  ];
  const memMode = !!LS.__memory;

  return pageHead('Settings & Backup', 'Company detail, data backup aur formula guide', '') +

    '<div class="grid cols-2 mb">' +
      card('Company Profile', 'Bill aur reports me yahi detail chhapti hai',
        '<button class="btn sm" data-act="editCompany">Edit</button>',
        '<div class="kv">' +
          '<span class="k">Business</span><b>' + esc(m.company) + '</b>' +
          '<span class="k">Tagline</span><span>' + esc(m.tagline || '—') + '</span>' +
          '<span class="k">Address</span><span>' + esc(m.address || '—') + '</span>' +
          '<span class="k">Phone</span><span>' + esc(m.phone || '—') + '</span>' +
          '<span class="k">GSTIN</span><span class="mono">' + esc(m.gstin || '—') + '</span>' +
          '<span class="k">State</span><span>' + esc(m.state || '—') + ' (CGST + SGST)' + '</span>' +
          '<span class="k">Financial Year</span><span>' + esc(m.fy || fyOf(TODAY)) + '</span>' +
          '<span class="k">Opening Cash / Bank</span><span>' + INR0(m.openingCash || 0) + ' · ' + INR0(m.openingBank || 0) + '</span>' +
          '<span class="k">Invoice prefix</span><span class="mono">' + esc(m.invoicePrefix || '') + '</span>' +
        '</div>') +
      card('Data & Backup', 'Browser me auto-save hota hai — backup lena zaroori hai',
        '',
        '<div class="alert"><span class="ic">' + (memMode ? '⚠️' : '✅') + '</span><div>' +
          (memMode ? '<b>Preview mode:</b> is iframe me browser storage band hai, data sirf is session tak rahega. File ko browser me kholein to auto-save chalu ho jayega.'
                   : '<b>Auto-save chalu:</b> har entry turant browser me save ho jati hai.') +
        '</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">' +
          '<button class="btn primary" data-act="backupJSON">⬇ Backup download (JSON)</button>' +
          '<button class="btn" data-act="restoreJSON">⬆ Backup restore</button>' +
          '<button class="btn" data-act="showJSON">JSON dekho / copy</button>' +
        '</div>' +
        '<div class="hr"></div>' +
        '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:6px">Records</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          counts.map(c => '<span class="tag-inline" style="font-size:11.5px">' + c[0] + ': <b>' + c[1] + '</b></span>').join('') +
        '</div>' +
        '<div class="hr"></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn" data-act="loadDemo">Demo data load karein</button>' +
          '<button class="btn danger" data-act="resetData">Sab data mitao (blank start)</button>' +
        '</div>' +
        '<div class="hr"></div>' +
        '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:6px">Financial Year</div>' +
        '<div class="kv"><span class="k">Current FY</span><span>' + (DB.meta.fy || '—') + '</span>' +
        '<span class="k">Last backup</span><span>' + (DB.settings.lastBackup ? dmy(DB.settings.lastBackup) + ' (' + daysSince(DB.settings.lastBackup) + ' din pehle)' : 'kabhi nahi') + '</span></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
          '<button class="btn" data-act="fyClose">FY closing karein</button>' +
          (typeof archivedFYs === 'function' && archivedFYs().length ? archivedFYs().map(f => '<button class="btn sm" data-act="restoreArch" data-fy="' + f + '">Archive ' + f + '</button>').join('') : '') +
        '</div>' +
        '<div class="tiny muted" style="margin-top:6px">FY closing: purana saal archive + naye saal me cash/bank/party/stock opening ke roop me.</div>') +
    '</div>' +

    '<div class="grid cols-2">' +
      card('Formula Guide', 'Ye app Tally jaisa chhota formula engine use karta hai', '',
        '<div class="formula">' +
          '<div><b>1. Ingredient rate</b> — rate box me expression likh sakte hain:</div>' +
          '<div class="w">   42        → ₹42</div>' +
          '<div class="w">   42*1.05   → ₹44.10 (5% badha hua)</div>' +
          '<div><b>2. Recipe qty</b>:</div>' +
          '<div class="w">   0.25      → 250 gram (unit kg)</div>' +
          '<div class="w">   8%        → batch base ka 8%</div>' +
          '<div class="w">   base*0.02 → formula se</div>' +
          '<div><b>3. Cost / pc</b> = Σ(qty × rate) ÷ yield ÷ (1 − wastage%) + (labour + overhead) ÷ yield + packaging</div>' +
          '<div><b>4. Price (auto)</b> = Cost/pc × (1 + markup%) → round up</div>' +
          '<div><b>5. Profit</b> = Revenue (ex-GST) − COGS − Kharche</div>' +
        '</div>' +
        '<div class="tiny muted" style="margin-top:8px">Product & Recipe screen par koi bhi qty/rate badal kar turant naya cost aur margin dekh sakte hain.</div>') +
      card('🎬 Tutorial & help', '2.5 minute ka video — setup se GST tak', '<button class="btn sm primary" data-act="tutorial">Video kholein</button>',
        '<div class="kv">' +
          '<div class="k">Video</div><div>Bakery · Store · Supply — poora workflow</div>' +
          '<div class="k">Guide</div><div><code>docs/Dream-Sandwich-Guide.md</code> (repo me)</div>' +
          '<div class="k">Shortcut</div><div>Sidebar ke neeche "Tutorial dekhein" button</div>' +
        '</div>' +
        '<div class="tiny muted mt">Video file <code>tutorial.mp4</code> isi folder me honi chahiye. Na ho to app normal chalta rahega.</div>', { tight: true }) +
      card('Audit Trail', 'Kaun sa entry kis role ne ki — last 15', '',
        (DB.audit && DB.audit.length) ? tableHTML([
          { label: 'Time', render: r => '<span class="tiny mono">' + esc(r.ts) + '</span>' },
          { label: 'Role', render: r => '<span class="badge ' + (r.role === 'owner' ? 'b-indigo' : 'b-teal') + '">' + esc(r.role) + '</span>' },
          { label: 'Kaam', render: r => '<b>' + esc(r.action) + '</b><div class="tiny muted">' + esc(r.detail || '') + '</div>' }
        ], DB.audit.slice(0, 15), { compact: true }) : '<div class="empty">Abhi koi action log nahi hua</div>', { tight: true }) +
      card('Billing Rules', 'Bill banate waqt ka behaviour', '',
        '<label class="check" style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="roundOffChk"' + (typeof roundOffOn === 'function' && roundOffOn() ? ' checked' : '') + '> Bill total nearest ₹1 me round karein (round-off)</label>' +
        '<div class="tiny muted" style="margin-bottom:10px">Item-wise discount aur bill discount bill form me hi milta hai. Return entry sale screen ke "← Return" button se.</div>' +
        '<div class="field" style="max-width:240px"><label>Loyalty — points per ₹100 bill</label><input id="loyaltyPct" type="text" value="' + esc(loyaltyPct()) + '"><div class="hint">0 = band · 1 point = ₹1</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" data-act="saveBilling">Save karein</button><button class="btn" data-act="saveLoyalty">Loyalty save</button></div>') +
      card('Login / Role', 'Owner ya Counter — PIN se control', '',
        '<label class="check" style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="pinOnChk"' + (num(DB.settings.pinOn) ? ' checked' : '') + '> App khulte hi login maange</label>' +
        '<div class="fields">' +
          '<div class="field"><label>Owner PIN (pura access)</label><input id="pinOwner" type="text" maxlength="6" value="' + esc(pinsOf().owner) + '"></div>' +
          '<div class="field"><label>Counter PIN (sirf roz ka kaam)</label><input id="pinCounter" type="text" maxlength="6" value="' + esc(pinsOf().counter) + '"></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
          '<button class="btn primary" data-act="savePins">PIN save karein</button>' +
          (num(DB.settings.pinOn) ? '<button class="btn" data-act="lockApp">🔒 Abhi lock karein</button>' : '') +
        '</div>' +
        '<div class="tiny muted" style="margin-top:8px">Counter role: Dashboard, Per Day, Bakery, Store, Supply — Reports/Bahi Khata/Settings band.</div>') +
      card('Reports dar reports', 'Aap kya kahan dekh sakte hain', '',
        '<div class="kv" style="row-gap:8px">' +
          '<span class="k">Bakery ka profit</span><span>P&L → Bakery column · Product P&L me cake/bread alag</span>' +
          '<span class="k">Store ka profit</span><span>P&L → Store column (chai, cold drink, counter sale)</span>' +
          '<span class="k">Supply ka profit</span><span>P&L → Supply column + Party ledger me udhaar</span>' +
          '<span class="k">Kaunsa product loss me</span><span>Product wise P&L → red margin</span>' +
          '<span class="k">Kitna maal bacha</span><span>Stock Summary → raw + finished</span>' +
          '<span class="k">Kis party ka udhaar</span><span>Party Ledger / Udhaar → balance</span>' +
          '<span class="k">GST kitna dena hai</span><span>GST Summary → net payable</span>' +
          '<span class="k">Din ka pura hisaab</span><span>Day Book → saare vouchers</span>' +
        '</div>') +
    '</div>';
}

function companyModal() {
  const m0 = DB.meta;
  openForm({
    title: 'Company Profile', width: 640, values: m0,
    fields: [
      { key: 'company', label: 'Business name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'address', label: 'Address', type: 'text', full: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'gstin', label: 'GSTIN', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'invoicePrefix', label: 'Invoice prefix', type: 'text', hint: 'jaise DS/26-27/' },
      { key: 'openingCash', label: 'Opening Cash ₹', type: 'text', hint: 'aaj godown/counter me jitna cash hai' },
      { key: 'openingBank', label: 'Opening Bank / UPI ₹', type: 'text' }
    ],
    submit: 'Save karein',
    onSubmit: d => { Object.assign(DB.meta, d); saveDB(); toast('Company detail save', 'ok'); }
  });
}

function backupDownload() {
  try {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dream-sandwich-backup-' + TODAY + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    if (DB.settings) { DB.settings.lastBackup = TODAY; saveDB(); }
    toast('Backup download ho gaya', 'ok');
  } catch (e) {
    toast('Download block hai — "JSON dekho" se copy karein', 'warn');
  }
}

function showJSONModal() {
  const json = JSON.stringify(DB);
  openModal({
    title: 'Data JSON', sub: 'Copy karke safe rakhein — restore me paste kar sakte hain', width: 760,
    body: '<textarea id="jsonBox" style="width:100%;height:320px;font-family:monospace;font-size:11px;border:1px solid #e3e9f1;border-radius:9px;padding:9px">' + esc(json) + '</textarea>' +
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn" id="jsonCopy">📋 Copy karein</button>' +
      '<button class="btn" id="jsonRestore">Is JSON ko restore karein</button></div>',
    foot: '<button class="btn" data-act="closeModal">Band karein</button>',
    focus: false
  });
  $('#jsonCopy').onclick = () => {
    const box = $('#jsonBox'); box.select();
    try { document.execCommand('copy'); toast('Copy ho gaya', 'ok'); } catch (e) { toast('Copy block — manually select karke copy karein', 'warn'); }
  };
  $('#jsonRestore').onclick = () => {
    try {
      const d = JSON.parse($('#jsonBox').value);
      if (!d.products || !d.ingredients) throw new Error('galat file');
      DB = d; saveDB(); closeModal(); render(); toast('Data restore ho gaya', 'ok');
    } catch (e) { toast('JSON galat hai', 'err'); }
  };
}

function restoreModal() {
  openModal({
    title: 'Backup Restore', sub: '.json backup file chunein', width: 520,
    body: '<input type="file" id="restoreFile" accept=".json,application/json" style="border:1px dashed #c9d6e6;padding:14px;border-radius:10px;width:100%;background:#f8fafc">' +
      '<div class="tiny muted" style="margin-top:8px">Restore karne par abhi ka data replace ho jayega.</div>',
    foot: '<button class="btn" data-act="closeModal">Cancel</button>',
    focus: false
  });
  $('#restoreFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d.products || !d.ingredients) throw new Error('bad');
        DB = d; saveDB(); closeModal(); render(); toast('Restore ho gaya', 'ok');
      } catch (err) { toast('File galat hai', 'err'); }
    };
    rd.readAsText(f);
  };
}

/* ---------- CSV buttons (report screens) ---------- */
document.addEventListener('click', e => {
  const id = e.target.id;
  if (!id) return;
  if (id === 'csvPnl') {
    const pl = plFor(P.from, P.to);
    const rows = CHANNELS.map(c => {
      const r = pl.channels[c.id];
      return [c.label, r.sales, r.gst, r.taxable, r.cogs, r.gross, r.expenses, r.profit, r.commonShare, r.profitAfterCommon];
    });
    rows.push(['TOTAL', pl.total.sales, pl.total.gst, pl.total.taxable, pl.total.cogs, pl.total.gross, pl.total.expenses, '', '', pl.total.net]);
    exportCSV('P&L-' + P.from + '_' + P.to + '.csv',
      ['Vertical', 'Sales(Incl GST)', 'GST', 'Revenue', 'COGS', 'GrossProfit', 'Expenses', 'ChannelProfit', 'CommonShare', 'NetProfit'], rows);
  }
  if (id === 'csvProd') {
    const rows = productPL(P.from, P.to).map(r => [r.name, r.category, r.qty, r.unitPrice, r.taxable, r.unitCost, r.cogs, r.profit, r.marginPct]);
    exportCSV('Product-PL-' + P.from + '_' + P.to + '.csv',
      ['Product', 'Category', 'Qty', 'AvgRate', 'Revenue', 'CostPerPc', 'TotalCost', 'Profit', 'Margin%'], rows);
  }
  if (id === 'csvDay') {
    const rows = dayBook(P.from, P.to).map(r => [r.date, r.voucher, r.particulars, r.account, r.dir === 'Dr' ? r.amount : '', r.dir === 'Cr' ? r.amount : '']);
    exportCSV('DayBook-' + P.from + '_' + P.to + '.csv', ['Date', 'Voucher', 'Particulars', 'Account', 'Debit', 'Credit'], rows);
  }
  if (id === 'csvGst') {
    const g = gstSummary(P.from, P.to);
    exportCSV('GST-' + P.from + '_' + P.to + '.csv', ['Rate', 'Taxable', 'Tax', 'Gross'],
      g.rows.map(r => [r.rate + '%', r.taxable, r.tax, r.gross]));
  }
  if (id === 'csvIng') {
    const st = ingredientStock();
    exportCSV('Ingredients-' + TODAY + '.csv', ['Ingredient', 'Unit', 'Rate', 'Stock', 'MinStock', 'Value', 'Vendor'],
      DB.ingredients.map(i => [i.name, i.unit, i.rate, st[i.id] || 0, i.minStock, (st[i.id] || 0) * num(i.rate), i.vendor]));
  }
});

function printReport(title) {
  const m = DB.meta;
  $('#printArea').innerHTML =
    '<div class="inv"><div class="ihead"><div><h1>' + esc(m.company) + '</h1>' +
      '<div style="font-size:11px;color:#444;line-height:1.6">' + esc(m.tagline || '') + '<br>' + esc(m.address || '') + '<br>GSTIN: ' + esc(m.gstin || '-') + '</div></div>' +
      '<div class="right"><div style="font-size:14px;font-weight:700">' + esc(title) + '</div>' +
      '<div>' + periodLabel() + '</div><div>Printed: ' + dmy(TODAY) + '</div></div></div></div>' +
    '<div style="margin-top:14px">' + $('#view').innerHTML + '</div>';
  try { window.print(); } catch (e) { toast('Print block hai — file download karke browser me kholein', 'warn'); }
}

Object.assign(ACT, {
  saveBilling: () => {
    DB.settings.roundOff = ($('#roundOffChk') && $('#roundOffChk').checked) ? 1 : 0;
    saveDB(); render(); toast('Billing rule save ho gaya', 'ok');
  },
  savePins: () => {
    const o = String(($('#pinOwner') || {}).value || '').trim();
    const c = String(($('#pinCounter') || {}).value || '').trim();
    if (o.length < 4 || c.length < 4) { toast('PIN kam se kam 4 digit ka rakhein', 'err'); return; }
    DB.settings.pins = { owner: o, counter: c };
    DB.settings.pinOn = ($('#pinOnChk') && $('#pinOnChk').checked) ? 1 : 0;
    saveDB(); render();
    toast('PIN save ho gaya' + (num(DB.settings.pinOn) ? ' · agle baar login maangega' : ' · login band hai'), 'ok');
  },
  printReport: d => printReport(d.title || 'Report'),
  editCompany: () => companyModal(),
  backupJSON: () => backupDownload(),
  showJSON: () => showJSONModal(),
  restoreJSON: () => restoreModal(),
  resetData: () => confirmBox('Pura data delete karke khali business se shuru karein? Backup liya hai to hi aage badhein — ye wapas nahi aayega.', () => resetDB(), 'Haan, sab mita do')
});
