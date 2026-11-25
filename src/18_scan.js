/* ================= BARCODE SCAN → BILL ME ITEM ================= */
let SCAN_FOCUS = false;

const prodCode = p => String((p && (p.barcode || p.id)) || '').trim().toUpperCase();

function findProductByCode(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return null;
  let hit = DB.products.find(p => prodCode(p) === c);
  if (hit) return hit;
  hit = DB.products.find(p => String(p.id).toUpperCase() === c);
  if (hit) return hit;
  hit = DB.products.find(p => String(p.name).toUpperCase().indexOf(c) === 0);
  if (hit) return hit;
  hit = DB.products.find(p => String(p.name).toUpperCase().indexOf(c) > -1);
  return hit || null;
}

/* sale form me item add / qty +1 */
function scanAddItem(code) {
  if (typeof SCAN_FOCUS === 'undefined') SCAN_FOCUS = false;
  if (typeof readSaleForm === 'function') readSaleForm();
  const p = findProductByCode(code);
  if (!p) { toast('Code nahi mila: ' + code, 'err'); SCAN_FOCUS = true; if (typeof drawSale === 'function') drawSale(); return false; }
  const line = SL.lines.find(l => l.productId === p.id);
  if (line) line.qty = String(r3(num(line.qty) + 1));
  else SL.lines.push({ productId: p.id, qty: '1', rate: partyRate(SL.partyId, p, SL.channel), discPct: 0 });
  SCAN_FOCUS = true;
  if (typeof drawSale === 'function') drawSale();
  toast(p.name + ' added', 'ok');
  return true;
}

/* scan input HTML (sale form ke sabse upar) */
function scanBoxHTML() {
  return '<div class="field full" style="margin-bottom:4px">' +
    '<label>🔍 Barcode scan / code <span class="tiny muted">(scanner se scan karein ya code likh kar Enter)</span></label>' +
    '<input id="scanBox" type="text" autocomplete="off" placeholder="890100000 ya product ka naam likh kar Enter" style="letter-spacing:.04em">' +
    '<div class="hint">Har scan par qty +1 badhti hai. Scanner keyboard jaisa hi kaam karta hai — kuch setting nahi chahiye.</div></div>' +
    '<div class="hr"></div>';
}

function bindScan() {
  const sb = $('#scanBox');
  if (!sb) return;
  sb.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      const v = sb.value;
      sb.value = '';
      scanAddItem(v);
    }
  });
  if (SCAN_FOCUS) setTimeout(() => { const s = $('#scanBox'); if (s) s.focus(); }, 30);
}

/* product editor me barcode field */
function barcodeFieldHTML() {
  const code = (typeof RP !== 'undefined' && RP) ? (RP.barcode || '') : '';
  return '<div class="field"><label>Barcode / Code <span class="tiny muted">(scan ke liye)</span></label>' +
    '<input class="rpF" data-k="barcode" value="' + esc(code) + '" placeholder="890100123">' +
    '<div class="hint">Khaali chhodein to product ID use hoga</div></div>';
}

Object.assign(ACT, {
  scanTest: () => {
    const codes = DB.products.slice(0, 3).map(p => prodCode(p) + ' → ' + p.name).join('\n');
    copyBox('Product codes', codes || 'Koi product nahi');
  }
});
