/* ================= DREAM SANDWICH — SEED / MASTER DATA ================= */
let DB;
let PRODUCT_CACHE = {};

/* ---------- ingredient master ---------- */
const SEED_ING = [
  ['MAIDA', 'Maida (Bakery Flour)', 'kg', 42, 60, 25, 'Shree Traders', 'flour'],
  ['ATTA', 'Atta (Gehu)', 'kg', 48, 30, 15, 'Shree Traders', 'flour'],
  ['SOOJI', 'Sooji / Rava', 'kg', 50, 12, 6, 'Shree Traders', 'flour'],
  ['SUGAR', 'Cheeni', 'kg', 46, 25, 12, 'Shree Traders', 'flour'],
  ['SALT', 'Namak', 'kg', 22, 10, 4, 'Shree Traders', 'flour'],
  ['YEAST', 'Dry Yeast', 'kg', 320, 3, 1.5, 'Shree Traders', 'flour'],
  ['OIL', 'Refined Oil', 'litre', 145, 20, 8, 'Ganesh Oil & Ghee', 'fat'],
  ['VANAS', 'Vanaspati (Dalda)', 'kg', 132, 12, 5, 'Ganesh Oil & Ghee', 'fat'],
  ['BUTTER', 'Butter', 'kg', 560, 5, 2, 'Bhopal Dairy', 'fat'],
  ['MILK', 'Doodh', 'litre', 62, 20, 8, 'Bhopal Dairy', 'dairy'],
  ['MILKP', 'Milk Powder', 'kg', 430, 4, 1.5, 'Bhopal Dairy', 'dairy'],
  ['PANEER', 'Paneer', 'kg', 390, 3, 1.5, 'Bhopal Dairy', 'dairy'],
  ['CHEESE', 'Cheese', 'kg', 490, 3, 1, 'Bhopal Dairy', 'dairy'],
  ['POTATO', 'Aloo', 'kg', 26, 35, 60, 'Fresh Veggie Mandi', 'veg'],
  ['PEAS', 'Matar', 'kg', 72, 8, 4, 'Fresh Veggie Mandi', 'veg'],
  ['ONION', 'Pyaz', 'kg', 36, 15, 7, 'Fresh Veggie Mandi', 'veg'],
  ['TOMATO', 'Tamatar', 'kg', 32, 10, 5, 'Fresh Veggie Mandi', 'veg'],
  ['CABBAGE', 'Patta Gobhi', 'kg', 22, 8, 4, 'Fresh Veggie Mandi', 'veg'],
  ['CARROT', 'Gajar', 'kg', 42, 4, 2, 'Fresh Veggie Mandi', 'veg'],
  ['GREENCH', 'Hari Mirch', 'kg', 65, 2, 1, 'Fresh Veggie Mandi', 'veg'],
  ['CORI', 'Dhaniya Patta', 'kg', 130, 1.5, 0.5, 'Fresh Veggie Mandi', 'veg'],
  ['GINGER', 'Adrak', 'kg', 125, 1.5, 0.5, 'Fresh Veggie Mandi', 'veg'],
  ['SPICE', 'Special Masala Mix', 'kg', 310, 3, 1.2, 'Shree Traders', 'flour'],
  ['KETCHUP', 'Tomato Ketchup', 'kg', 125, 3, 1, 'Shree Traders', 'flour'],
  ['BAKING', 'Baking Powder', 'kg', 185, 1.5, 0.6, 'Shree Traders', 'flour'],
  ['COCOA', 'Cocoa Powder', 'kg', 560, 1, 0.4, 'Shree Traders', 'flour'],
  ['ESSENCE', 'Vanilla Essence', 'litre', 900, 0.5, 0.2, 'Shree Traders', 'flour'],
  ['TEALEAF', 'Chai Patti', 'kg', 480, 2, 0.8, 'Shree Traders', 'flour'],
  ['BREADSLICE', 'Bread Slice (in-house)', 'pc', 1.8, 240, 100, 'In-House', 'inhouse'],
  ['BREADBAG', 'Bread Pouch 400g', 'pc', 2.6, 400, 150, 'Packwell Packaging', 'pack'],
  ['PATTYPOUCH', 'Patties/Samosa Pouch', 'pc', 1.4, 700, 250, 'Packwell Packaging', 'pack'],
  ['BASETRAY', 'Pizza Base Tray', 'pc', 3.2, 260, 100, 'Packwell Packaging', 'pack'],
  ['CAKEBOX', 'Cake Box 500g', 'pc', 7, 90, 80, 'Packwell Packaging', 'pack'],
  ['CUP', 'Chai Cup + Lid', 'pc', 1.2, 300, 100, 'Packwell Packaging', 'pack'],
  ['COOKIEPOUCH', 'Cookies Pouch 250g', 'pc', 4.2, 120, 40, 'Packwell Packaging', 'pack'],
  ['SANDWICHPAPER', 'Sandwich Wrap Paper', 'pc', 2.8, 200, 80, 'Packwell Packaging', 'pack'],
  ['RES_DRINK', 'Cold Drink 250ml (resale)', 'pc', 14, 48, 60, 'Bhopal Beverages', 'resale'],
  ['RES_CHIPS', 'Chips Packet (resale)', 'pc', 15, 40, 20, 'Bhopal Beverages', 'resale'],
  ['RES_WATER', 'Water Bottle 1L (resale)', 'pc', 12, 36, 18, 'Bhopal Beverages', 'resale']
];

/* ---------- products + recipe (formula based costing) ---------- */
const SEED_PROD = [
  {
    id: 'BREAD', name: 'Bread 400g (Loaf)', unit: 'pc', price: 30, bulkPrice: 27, gstPct: 5,
    autoPrice: 1, markupPct: 22, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 10, yieldQty: 35, labourPerBatch: 120, overheadPerBatch: 90,
      packagingPerPc: 0, wastagePct: 4,
      lines: [
        { ingId: 'MAIDA', qty: '10' }, { ingId: 'SUGAR', qty: '0.25' }, { ingId: 'SALT', qty: '0.06' },
        { ingId: 'YEAST', qty: '0.06' }, { ingId: 'OIL', qty: '0.2' }, { ingId: 'MILKP', qty: '0.1' },
        { ingId: 'BREADBAG', qty: 'yq' }
      ]
    }
  },
  {
    id: 'PIZZABASE', name: 'Pizza Base 6" (Pack of 2)', unit: 'pack', price: 41, bulkPrice: 37, gstPct: 5,
    autoPrice: 1, markupPct: 165, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 5, yieldQty: 40, labourPerBatch: 110, overheadPerBatch: 70,
      packagingPerPc: 0, wastagePct: 3,
      lines: [
        { ingId: 'MAIDA', qty: '5' }, { ingId: 'SUGAR', qty: '0.12' }, { ingId: 'SALT', qty: '0.05' },
        { ingId: 'YEAST', qty: '0.05' }, { ingId: 'OIL', qty: '0.3' }, { ingId: 'MILKP', qty: '0.06' },
        { ingId: 'BASETRAY', qty: 'yq' }
      ]
    }
  },
  {
    id: 'SAMOSA', name: 'Baked Samosa (pc)', unit: 'pc', price: 16, bulkPrice: 14, gstPct: 5,
    autoPrice: 1, markupPct: 160, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 3, yieldQty: 150, labourPerBatch: 165, overheadPerBatch: 95,
      packagingPerPc: 0, wastagePct: 5,
      lines: [
        { ingId: 'MAIDA', qty: '3' }, { ingId: 'VANAS', qty: '0.5' }, { ingId: 'POTATO', qty: '2.5' },
        { ingId: 'PEAS', qty: '0.4' }, { ingId: 'SPICE', qty: '0.15' }, { ingId: 'SALT', qty: '0.05' },
        { ingId: 'OIL', qty: '0.35' }, { ingId: 'GREENCH', qty: '0.1' }, { ingId: 'PATTYPOUCH', qty: 'yq' }
      ]
    }
  },
  {
    id: 'PATTIES', name: 'Baked Veg Patties (pc)', unit: 'pc', price: 21, bulkPrice: 18, gstPct: 5,
    autoPrice: 1, markupPct: 200, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 2.5, yieldQty: 120, labourPerBatch: 175, overheadPerBatch: 95,
      packagingPerPc: 0, wastagePct: 5,
      lines: [
        { ingId: 'MAIDA', qty: '2.5' }, { ingId: 'VANAS', qty: '0.5' }, { ingId: 'POTATO', qty: '2' },
        { ingId: 'PEAS', qty: '0.3' }, { ingId: 'SPICE', qty: '0.12' }, { ingId: 'ONION', qty: '0.6' },
        { ingId: 'SALT', qty: '0.04' }, { ingId: 'OIL', qty: '0.3' }, { ingId: 'PATTYPOUCH', qty: 'yq' }
      ]
    }
  },
  {
    id: 'SANDWICH', name: 'Veg Grilled Sandwich (pc)', unit: 'pc', price: 35, bulkPrice: 32, gstPct: 5,
    autoPrice: 1, markupPct: 75, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 0, yieldQty: 60, labourPerBatch: 130, overheadPerBatch: 45,
      packagingPerPc: 0, wastagePct: 2,
      lines: [
        { ingId: 'BREADSLICE', qty: '120' }, { ingId: 'BUTTER', qty: '0.5' }, { ingId: 'TOMATO', qty: '0.8' },
        { ingId: 'ONION', qty: '0.6' }, { ingId: 'CABBAGE', qty: '1' }, { ingId: 'CHEESE', qty: '0.35' },
        { ingId: 'GREENCH', qty: '0.2' }, { ingId: 'KETCHUP', qty: '0.5' }, { ingId: 'SANDWICHPAPER', qty: 'yq' }
      ]
    }
  },
  {
    id: 'BUN', name: 'Bun / Pav (pc)', unit: 'pc', price: 7, bulkPrice: 6, gstPct: 5,
    autoPrice: 1, markupPct: 45, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 8, yieldQty: 200, labourPerBatch: 140, overheadPerBatch: 75,
      packagingPerPc: 0.5, wastagePct: 3,
      lines: [
        { ingId: 'MAIDA', qty: '8' }, { ingId: 'SUGAR', qty: '0.6' }, { ingId: 'SALT', qty: '0.08' },
        { ingId: 'YEAST', qty: '0.07' }, { ingId: 'OIL', qty: '0.4' }, { ingId: 'MILKP', qty: '0.15' }
      ]
    }
  },
  {
    id: 'CAKE500', name: 'Cake 500g (Vanilla)', unit: 'pc', price: 317, bulkPrice: 290, gstPct: 18,
    autoPrice: 1, markupPct: 40, priceRound: 1, category: 'Cake',
    recipe: {
      batchBase: 2.5, yieldQty: 8, labourPerBatch: 320, overheadPerBatch: 160,
      packagingPerPc: 0, wastagePct: 2,
      lines: [
        { ingId: 'MAIDA', qty: '2.5' }, { ingId: 'SUGAR', qty: '2.8' }, { ingId: 'BUTTER', qty: '1.5' },
        { ingId: 'MILK', qty: '0.6' }, { ingId: 'MILKP', qty: '0.2' }, { ingId: 'BAKING', qty: '0.04' },
        { ingId: 'ESSENCE', qty: '0.05' }, { ingId: 'CAKEBOX', qty: 'yq' }
      ]
    }
  },
  {
    id: 'COOKIES', name: 'Cookies 250g (Pack)', unit: 'pack', price: 49, bulkPrice: 44, gstPct: 18,
    autoPrice: 1, markupPct: 80, priceRound: 1, category: 'Bakery',
    recipe: {
      batchBase: 3, yieldQty: 40, labourPerBatch: 130, overheadPerBatch: 65,
      packagingPerPc: 0, wastagePct: 2,
      lines: [
        { ingId: 'MAIDA', qty: '3' }, { ingId: 'VANAS', qty: '1.4' }, { ingId: 'BUTTER', qty: '0.4' },
        { ingId: 'SUGAR', qty: '1.5' }, { ingId: 'MILKP', qty: '0.2' }, { ingId: 'BAKING', qty: '0.03' },
        { ingId: 'COOKIEPOUCH', qty: 'yq' }
      ]
    }
  },
  {
    id: 'CHAI', name: 'Chai (Cup)', unit: 'cup', price: 13, bulkPrice: 12, gstPct: 5,
    autoPrice: 1, markupPct: 45, priceRound: 1, category: 'Store',
    recipe: {
      batchBase: 0, yieldQty: 40, labourPerBatch: 60, overheadPerBatch: 45,
      packagingPerPc: 0, wastagePct: 2,
      lines: [
        { ingId: 'TEALEAF', qty: '0.08' }, { ingId: 'MILK', qty: '2' }, { ingId: 'SUGAR', qty: '0.4' },
        { ingId: 'GINGER', qty: '0.1' }, { ingId: 'CUP', qty: 'yq' }
      ]
    }
  },
  {
    id: 'COLDDRINK', name: 'Cold Drink 250ml', unit: 'pc', price: 20, bulkPrice: 19, gstPct: 28,
    autoPrice: 1, markupPct: 40, priceRound: 1, category: 'Store',
    recipe: { batchBase: 0, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [{ ingId: 'RES_DRINK', qty: '1' }] }
  },
  {
    id: 'CHIPS', name: 'Chips Packet', unit: 'pc', price: 20, bulkPrice: 19, gstPct: 12,
    autoPrice: 1, markupPct: 35, priceRound: 1, category: 'Store',
    recipe: { batchBase: 0, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [{ ingId: 'RES_CHIPS', qty: '1' }] }
  },
  {
    id: 'WATER', name: 'Water Bottle 1L', unit: 'pc', price: 20, bulkPrice: 18, gstPct: 18,
    autoPrice: 1, markupPct: 65, priceRound: 1, category: 'Store',
    recipe: { batchBase: 0, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [{ ingId: 'RES_WATER', qty: '1' }] }
  }
];

const SEED_OUTLETS = [
  ['Sharma Kirana Store', 'MP Nagar', '98765 11021', 15, 15000],
  ['Janta General Store', 'Karond', '98765 11022', 7, 8000],
  ['City Mart', 'Arera Colony', '98765 11023', 30, 25000],
  ['Gupta Dairy & Bakery', 'Kolar Road', '98765 11024', 15, 12000],
  ['Anand Tea Stall', 'New Market', '98765 11025', 7, 6000],
  ['Sangam Cafe', 'Bittan Market', '98765 11026', 15, 10000],
  ['Vikas Departmental Store', 'Ayodhya Bypass', '98765 11027', 21, 18000],
  ['Railway Canteen', 'Bhopal Jn.', '98765 11028', 30, 20000]
];
const SEED_VENDORS = [
  ['Shree Traders', 'Mandi Road', '98765 22001', 15, 0, 'MAIDA'],
  ['Bhopal Dairy', 'Bittan Market', '98765 22002', 7, 0, 'MILK'],
  ['Fresh Veggie Mandi', 'Karond Mandi', '98765 22003', 3, 0, 'VEG'],
  ['Packwell Packaging', 'Govindpura', '98765 22004', 15, 0, 'PACK'],
  ['Ganesh Oil & Ghee', 'Jumerati', '98765 22005', 15, 0, 'OIL'],
  ['Bhopal Beverages', 'Indrapuri', '98765 22006', 7, 0, 'RES']
];
const SEED_STAFF = [
  ['Ramesh Yadav', 'Head Baker', 'monthly', 18000, 0, 'bakery'],
  ['Sunil Verma', 'Bakery Helper', 'daily', 450, 0, 'bakery'],
  ['Kiran Bai', 'Counter Sales', 'monthly', 9000, 0, 'store'],
  ['Ajay Kushwaha', 'Delivery / Supply', 'monthly', 12000, 0, 'supply'],
  ['Pooja Sharma', 'Accounts & Billing', 'monthly', 8000, 0, 'common']
];

/* ---------- BLANK database (naya business shuru karne ke liye) ---------- */
function emptyDB() {
  return {
    version: 2,
    demo: 0,
    meta: {
      company: 'Dream Sandwich',
      tagline: 'Bakery · Store · Marketing Supply',
      address: '', phone: '', gstin: '', state: 'Madhya Pradesh',
      fy: fyOf(TODAY), invoicePrefix: 'DS/' + fyOf(TODAY).slice(2) + '/',
      openingCash: 0, openingBank: 0
    },
    settings: { gstOn: 1 },
    ingredients: [], products: [], parties: [], staff: [], agents: [],
    purchases: [], production: [], sales: [], expenses: [], payments: [],
    orders: [], wastage: [], stockAdj: [], agentDeposits: []
  };
}
const isBlankDB = d => (!d.products || !d.products.length) && (!d.sales || !d.sales.length);

/* ---------- DEMO database (sirf dekhne/samajhne ke liye) ---------- */
function demoDB() {
  const db = emptyDB();
  db.demo = 1;
  db.meta = Object.assign(db.meta, {
    address: 'Plot 12, Zone-II, MP Nagar, Bhopal (M.P.) 462011',
    phone: '+91 98765 43210',
    gstin: '23ABCDE1234F1Z5',
    openingCash: 25000, openingBank: 85000
  });
  db.ingredients = SEED_ING.map(r => ({
    id: r[0], name: r[1], unit: r[2], rate: r[3], opening: r[4], minStock: r[5], vendor: r[6], group: r[7]
  }));
  db.products = JSON.parse(JSON.stringify(SEED_PROD));
  const LIFE = { BREAD: 2, PIZZABASE: 4, SAMOSA: 1, PATTIES: 1, SANDWICH: 1, BUN: 2, CAKE500: 3, COOKIES: 25, CHAI: 1, COLDDRINK: 120, CHIPS: 90, WATER: 180 };
  db.products.forEach(p => { p.shelfLife = LIFE[p.id] || 3; });
  db.products.forEach((p, i) => { p.barcode = '890' + String(100000 + i * 7).slice(0, 6); });
  const HSN = { BREAD: '1905', PIZZABASE: '1905', SAMOSA: '1905', PATTIES: '1905', SANDWICH: '1905', BUN: '1905', CAKE500: '1905', COOKIES: '1905', CHAI: '2106', COLDDRINK: '2202', CHIPS: '2005', WATER: '2201' };
  db.products.forEach(p => { p.hsn = HSN[p.id] || '1905'; });
  db.parties = [].concat(
    SEED_OUTLETS.map(r => ({ id: uid('o'), name: r[0], type: 'outlet', area: r[1], phone: r[2], creditDays: r[3], creditLimit: r[4], opening: 0 })),
    SEED_VENDORS.map(r => ({ id: uid('v'), name: r[0], type: 'vendor', area: r[1], phone: r[2], creditDays: r[3], creditLimit: 0, opening: 0, category: r[5] }))
  );
  db.staff = SEED_STAFF.map(r => ({ id: uid('s'), name: r[0], role: r[1], payType: r[2], rate: r[3], daysPresent: 26, vertical: r[5] }));
  db.agents = [
    { id: uid('ag'), name: 'Ajay Kushwaha', phone: '98765 33201', area: 'MP Nagar' },
    { id: uid('ag'), name: 'Sonu Rathore', phone: '98765 33202', area: 'Karond' }
  ];
  DB = db;
  buildSeedTransactions(db);
  /* 8b) PURCHASE ORDERS (demo) — kuch pending, kuch partial */
  db.purchaseOrders = [];
  (function seedPO() {
    const vends = db.parties.filter(p => p.type === 'vendor');
    if (!vends.length || !db.ingredients.length) return;
    const pick = (id) => db.ingredients.find(i => i.id === id) || db.ingredients[0];
    const defs = [
      { v: vends[0], d: addDays(TODAY, -4), lines: [[pick('MAIDA'), 100, 42], [pick('SUGAR'), 25, 46]] },
      { v: vends[1] || vends[0], d: addDays(TODAY, -2), lines: [[pick('OIL'), 15, 145], [pick('VANAS'), 10, 132]] },
      { v: vends[0], d: TODAY, lines: [[pick('YEAST'), 5, 320], [pick('MILKP'), 20, 430]] }
    ];
    const fy = db.meta.fy || fyOf(TODAY);
    defs.forEach((d, i) => {
      db.purchaseOrders.push({
        id: uid('po'), no: 'PO/' + fy + '/' + String(i + 1).padStart(4, '0'), date: d.d,
        vendorId: d.v.id, lines: d.lines.map(l => ({ ingId: l[0].id, qty: l[1], rate: l[2] })), note: 'Weekly order'
      });
    });
    /* ek PO partial received */
    const po = db.purchaseOrders[0];
    if (po) {
      const l = po.lines[0];
      db.purchases.push({
        id: uid('pu'), date: addDays(po.date, 1), partyId: po.vendorId, poId: po.id,
        lines: [{ ingId: l.ingId, qty: Math.round(l.qty * 0.6), rate: l.rate }],
        amount: r2(Math.round(l.qty * 0.6) * l.rate), paidAmount: 0, payMode: 'credit', note: 'PO ke against'
      });
    }
  })();

  /* 8b2) COMBO + RECURRING (demo) */
  (function seedCombo() {
    const sd = db.products.find(p => p.id === 'SANDWICH');
    const cd = db.products.find(p => p.id === 'COLDDRINK');
    if (!sd || !cd) return;
    db.products.push({
      id: 'COMBO1', name: 'Sandwich + Cold Drink Combo', unit: 'set', price: 49, bulkPrice: 45, gstPct: 5,
      category: 'Combo', autoPrice: 0, markupPct: 0, priceRound: 1, costMode: 'combo', shelfLife: 1,
      hsn: '1905', barcode: '890900001',
      combo: [{ productId: 'SANDWICH', qty: 1 }, { productId: 'COLDDRINK', qty: 1 }],
      recipe: { batchBase: 1, yieldQty: 1, labourPerBatch: 0, overheadPerBatch: 0, packagingPerPc: 0, wastagePct: 0, lines: [] }
    });
  })();
  db.recurring = [
    { id: uid('rc'), label: 'Dukaan ka kiraya', category: 'Shop Rent', vertical: 'common', amount: 12000, day: 5, active: 1, lastPosted: monthKey(TODAY) },
    { id: uid('rc'), label: 'Bijli bill', category: 'Electricity', vertical: 'common', amount: 7000, day: 10, active: 1, lastPosted: monthKey(TODAY) },
    { id: uid('rc'), label: 'Internet', category: 'Mobile / Internet', vertical: 'common', amount: 699, day: 3, active: 1, lastPosted: monthKey(TODAY) }
  ];
  db.writeOffs = [];
  db.assets = [
    { id: uid('as'), name: 'Rotary Oven (12 tray)', date: addDays(TODAY, -180), cost: 180000, emi: 8500, tenure: 24, paidMonths: 6, lastPosted: monthKey(TODAY), vertical: 'bakery', active: 1 },
    { id: uid('as'), name: 'Deep Freezer 500L', date: addDays(TODAY, -120), cost: 42000, emi: 2100, tenure: 18, paidMonths: 4, lastPosted: monthKey(TODAY), vertical: 'store', active: 1 }
  ];
  db.loyalty = [];
  db.parties.filter(p => p.type === 'outlet').slice(0, 4).forEach((p, i) => { p.points = [45, 28, 12, 60][i] || 10; });
  db.audit = [{ id: uid('au'), ts: TODAY + ' 09:10', role: 'owner', action: 'Demo data', detail: 'sample business load hua' }];

  /* 8c) VENDOR PAYMENTS + SALES RETURNS (demo) */
  db.vendorPayments = [];
  (function seedVP() {
    const vends = db.parties.filter(p => p.type === 'vendor');
    vends.slice(0, 3).forEach((v, i) => {
      db.vendorPayments.push({
        id: uid('vp'), date: addDays(TODAY, -(3 + i * 5)), partyId: v.id,
        amount: [18000, 12500, 9000][i] || 5000, mode: i % 2 ? 'upi' : 'cash', note: 'Bill settlement'
      });
    });
  })();
  (function seedReturns() {
    let sd2 = 13579;
    const rnd2 = () => { sd2 = (sd2 * 1103515245 + 12345) % 2147483648; return sd2 / 2147483648; };
    const ri = (a, b) => a + Math.floor(rnd2() * (b - a + 1));
    const prods = db.products.filter(p => num(p.price) > 0);
    const outs = db.parties.filter(p => p.type === 'outlet');
    if (!prods.length || !outs.length) return;
    const reasons = ['Damage', 'Expired', 'Galat maal'];
    for (let i = 0; i < 4; i++) {
      const p = prods[ri(0, prods.length - 1)];
      const o = outs[ri(0, outs.length - 1)];
      const q = ri(2, 8);
      db.sales.push({
        id: uid('sr'), date: addDays(TODAY, -(2 + i * 4)), channel: 'supply', productId: p.id,
        qty: -q, rate: p.bulkPrice || p.price, partyId: o.id,
        payMode: i % 2 ? 'cash' : 'credit', discPct: 0, gstPct: num(p.gstPct), invNo: '',
        isReturn: 1, reason: reasons[i % reasons.length], note: 'Customer ne wapas kiya'
      });
    }
    db.sales.sort((a, b) => a.date < b.date ? 1 : -1);
  })();

  /* 9) ATTENDANCE + ADVANCE (demo) */
  if (db.staff.length) {
    let sd = 424242;
    const rnd = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; };
    const chance = p => rnd() < p;
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    db.attendance = [];
    const mStart = startOfMonth(TODAY);
    for (let d = mStart; d <= TODAY; d = addDays(d, 1)) {
      if (d > TODAY) break;
      db.staff.forEach(st => {
        const r = chance(.88);
        const status = r ? 'P' : (chance(.5) ? 'H' : 'A');
        db.attendance.push({ id: uid('at'), date: d, staffId: st.id, status: status, ot: (status === 'P' && chance(.18)) ? ri(1, 3) : 0 });
      });
    }
    db.advances = db.staff.slice(0, 2).map((st, i) => ({
      id: uid('adv'), date: addDays(TODAY, -(6 + i * 4)), staffId: st.id,
      amount: i ? 1500 : 2000, mode: 'cash', note: 'ghar ke liye advance'
    }));
    db.salaryPaid = [];
    db.staff.forEach(st => {
      const recs = db.attendance.filter(a => a.staffId === st.id && monthKey(a.date) === monthKey(TODAY));
      const P = recs.filter(a => a.status === 'P').length, H = recs.filter(a => a.status === 'H').length;
      const ot = recs.reduce((a, b) => a + num(b.ot), 0);
      const perDay = st.payType === 'monthly' ? num(st.rate) / 26 : num(st.rate);
      const earned = r2(perDay * (P + H * .5) + ot * perDay / 8);
      const adv = db.advances.filter(a => a.staffId === st.id).reduce((a, b) => a + num(b.amount), 0);
      db.salaryPaid.push({ id: uid('sp'), date: startOfMonth(TODAY), month: monthKey(TODAY), staffId: st.id, amount: r2(Math.max(0, earned - adv)) });
    });
  }

  return db;
}

/* ---------- generate 60+ days of realistic transactions ---------- */
function buildSeedTransactions(db) {
  let seed = 987654321;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const chance = p => rnd() < p;
  const shuffle = arr => arr.map(v => [rnd(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const rmoney = v => Math.round(v);

  const VOL = 2;               // business volume multiplier (demo data)
  const start = addDays(TODAY, -62);
  const byId = {};
  db.products.forEach(p => byId[p.id] = p);

  const PLAN = [
    { id: 'BREAD', min: 30, max: 42, chance: .96 },
    { id: 'PIZZABASE', min: 32, max: 52, chance: .95 },
    { id: 'SAMOSA', min: 110, max: 175, chance: .97 },
    { id: 'PATTIES', min: 85, max: 135, chance: .95 },
    { id: 'SANDWICH', min: 30, max: 55, chance: .92 },
    { id: 'BUN', min: 150, max: 220, chance: .94 },
    { id: 'CAKE500', min: 3, max: 9, chance: .62 },
    { id: 'COOKIES', min: 20, max: 40, chance: .7 }
  ];
  const outstanding = {};
  db.parties.filter(p => p.type === 'outlet').forEach(p => outstanding[p.id] = 0);

  for (let d = start; d <= TODAY; d = addDays(d, 1)) {
    const dow = new Date(d + 'T00:00:00').getDay();
    const dom = Number(d.slice(8, 10));
    const avail = {};

    /* 1) PRODUCTION */
    PLAN.forEach(pl => {
      if (!chance(pl.chance)) return;
      let q = ri(pl.min, pl.max) * VOL;
      if (dow === 0) q = Math.round(q * 0.85);
      const p = byId[pl.id];
      const yq = Math.max(0.0001, productCost(p).yieldQty);
      db.production.push({ id: uid('pr'), date: d, productId: pl.id, qty: q, batches: r3(q / yq) });
      avail[pl.id] = q;
    });

    const makeSale = (pid, qty, channel, partyId, payMode, discPct) => {
      const p = byId[pid];
      if (!p) return;
      const cap = avail[pid] || 0;
      const q = Math.min(qty, Math.floor(cap));
      if (q <= 0) return;
      avail[pid] = cap - q;
      let rate = channel === 'supply' ? supplyRateOf(p) : priceOf(p);
      if (discPct) rate = r3(rate * (1 - discPct / 100));
      rate = Math.round(rate * 2) / 2;
      db.sales.push({
        id: uid('sl'), date: d, channel, productId: pid, qty: q, rate,
        partyId: partyId || '', payMode: payMode || 'cash', discPct: discPct || 0,
        gstPct: p.gstPct, invNo: ''
      });
      if (channel === 'supply' && payMode === 'credit' && partyId) {
        outstanding[partyId] = (outstanding[partyId] || 0) + q * rate;
      }
    };

    /* 2) MARKETING SUPPLY — outlets ko supply */
    shuffle(db.parties.filter(p => p.type === 'outlet')).forEach(o => {
      const prob = o.creditDays >= 21 ? .36 : .46;
      if (!chance(prob)) return;
      const items = shuffle(['BREAD', 'PIZZABASE', 'SAMOSA', 'PATTIES', 'BUN', 'COOKIES', 'CAKE500']).slice(0, ri(1, 3));
      const payMode = chance(.15) ? 'upi' : 'credit';
      const disc = chance(.25) ? ri(2, 6) : 0;
      items.forEach(pid => {
        const ranges = { BREAD: [8, 20], PIZZABASE: [4, 12], SAMOSA: [18, 45], PATTIES: [14, 34], BUN: [25, 50], COOKIES: [4, 10], CAKE500: [1, 2] };
        const rr = ranges[pid] || [2, 8];
        makeSale(pid, ri(rr[0], rr[1]) * VOL, 'supply', o.id, payMode, disc);
      });
    });

    /* 3) BAKERY COUNTER */
    const bakeryPlan = { BREAD: [10, 20], PIZZABASE: [8, 18], SAMOSA: [25, 45], PATTIES: [14, 30], SANDWICH: [12, 25], BUN: [20, 40], CAKE500: [1, 4], COOKIES: [5, 12] };
    Object.keys(bakeryPlan).forEach(pid => {
      if (!chance(.93)) return;
      const rr = bakeryPlan[pid];
      makeSale(pid, ri(rr[0], rr[1]) * VOL, 'bakery', '', chance(.55) ? 'cash' : 'upi', 0);
    });

    /* 4) STORE / STALL COUNTER */
    const storePlan = { CHAI: [22, 48], COLDDRINK: [12, 30], CHIPS: [8, 20], WATER: [5, 15], SAMOSA: [10, 25], PATTIES: [8, 18], BUN: [10, 25], SANDWICH: [5, 15], CAKE500: [0, 2] };
    Object.keys(storePlan).forEach(pid => {
      if (!chance(.9)) return;
      const rr = storePlan[pid];
      if (pid === 'CHAI' || pid === 'COLDDRINK' || pid === 'CHIPS' || pid === 'WATER') {
        const p = byId[pid];
        const q = ri(rr[0], rr[1]) * VOL;
        const rate = Math.round(priceOf(p));
        db.sales.push({ id: uid('sl'), date: d, channel: 'store', productId: pid, qty: q, rate, partyId: '', payMode: chance(.6) ? 'cash' : 'upi', discPct: 0, gstPct: p.gstPct, invNo: '' });
      } else {
        makeSale(pid, ri(rr[0], rr[1]) * VOL, 'store', '', chance(.6) ? 'cash' : 'upi', 0);
      }
    });

    /* 5) PAYMENTS IN from outlets */
    Object.keys(outstanding).forEach(pid => {
      if (!outstanding[pid]) return;
      if (chance(.22)) {
        const amt = Math.round(outstanding[pid] * (ri(55, 100) / 100));
        if (amt > 0) {
          db.payments.push({ id: uid('pay'), date: d, partyId: pid, amount: amt, mode: chance(.5) ? 'cash' : 'upi', note: 'Outlet payment' });
          outstanding[pid] -= amt;
        }
      }
    });

    /* 6) EXPENSES */
    const exp = (vertical, category, amount, note) => db.expenses.push({ id: uid('ex'), date: d, vertical, category, amount, note: note || '' });
    if (dom === 1) {
      exp('store', 'Shop Rent', 12000, 'MP Nagar shop ka kiraya');
      exp('bakery', 'Rent / Godown', 6000, 'Bakery godown');
      exp('common', 'Mobile / Internet', 699, 'Broadband + phone');
      /* staff salary */
      const byV = {};
      db.staff.forEach(s => {
        const m = s.payType === 'monthly' ? s.rate : s.rate * s.daysPresent;
        byV[s.vertical] = (byV[s.vertical] || 0) + m;
      });
      Object.keys(byV).forEach(v => exp(v, 'Staff Salary', byV[v], 'Monthly salary'));
    }
    if (dom === 5) exp('common', 'Electricity', ri(6200, 7800), 'MPEB bill');
    if (dom % 5 === 2) exp('bakery', 'Gas Cylinder', 1450, 'LPG commercial');
    if (dow === 1) exp('supply', 'Transport / Fuel', ri(700, 1100), 'Delivery van');
    if (dom === 12) exp('bakery', 'Machine Maintenance', ri(600, 1200), 'Oven / mixer servicing');
    if (dom === 20) exp('store', 'Packaging Material', ri(2500, 4000), 'Pouches / boxes');
    if (chance(.12)) exp('common', 'Misc / Repairs', ri(180, 850), 'Daily misc');
    if (dom === 8) exp('store', 'Cleaning / Consumables', ri(400, 900), '');
  }

  /* 6.5) PRODUCTION ko sales ke hisaab se trim karein (fresh bakery me FG stock ~0 hota hai) */
  const soldBy = {}, soldOn = {};
  db.sales.forEach(s => {
    soldBy[s.productId] = (soldBy[s.productId] || 0) + num(s.qty);
    const k = s.productId + '|' + s.date;
    soldOn[k] = (soldOn[k] || 0) + num(s.qty);
  });
  db.products.forEach(p => {
    const sold = soldBy[p.id] || 0;
    let produced = db.production.filter(x => x.productId === p.id).reduce((a, x) => a + num(x.qty), 0);
    const target = Math.round(sold * 1.06);
    if (!produced || produced <= target) return;
    let excess = produced - target;
    const list = db.production.filter(x => x.productId === p.id).sort((a, b) => a.date < b.date ? 1 : -1);
    for (const pr of list) {
      if (excess <= 0.001) break;
      const q = num(pr.qty);
      const minKeep = num(soldOn[p.id + '|' + pr.date]) || 0;
      const cut = Math.min(q - minKeep, excess);
      if (cut > 0) { pr.qty = r3(q - cut); excess -= cut; }
    }
    db.production.forEach(x => {
      const pp = byId[x.productId];
      x.batches = r3(num(x.qty) / Math.max(0.0001, productCost(pp).yieldQty));
    });
  });
  db.production = db.production.filter(x => num(x.qty) > 0.0001);

  /* 7) PURCHASES — consumption ke hisaab se weekly */
  const cons = {};
  db.production.forEach(pr => {
    const p = byId[pr.productId];
    if (!p) return;
    (p.recipe.lines || []).forEach(l => {
      const q = lineQty(l, p.recipe) * (pr.batches || 0);
      cons[l.ingId] = (cons[l.ingId] || 0) + q;
    });
  });
  db.ingredients.forEach(ing => {
    const used = cons[ing.id] || 0;
    ing.opening = used > 0 ? r3(used * 0.12 + Number(ing.minStock) * 0.5) : r3(Number(ing.minStock) * 2);
    if (used <= 0) return;
    const total = used * 0.98 + Number(ing.minStock) * 0.5;
    const weeks = 9;
    const vendor = db.parties.find(p => p.type === 'vendor' && p.name === ing.vendor);
    for (let w = 0; w < weeks; w++) {
      const share = (w === weeks - 1) ? null : total / weeks * (0.85 + rnd() * 0.3);
      const q = r3(share || Math.max(0, total - (total / weeks * (weeks - 1) * 1.0)));
      if (q <= 0) continue;
      const rate = r3(Number(ing.rate) * (0.94 + rnd() * 0.12));
      const totalAmt = r3(q * rate);
      db.purchases.push({
        id: uid('pu'), date: addDays(start, w * 7 + 1),
        partyId: vendor ? vendor.id : '', lines: [{ ingId: ing.id, qty: q, rate }],
        amount: totalAmt, paidAmount: chance(.3) ? 0 : totalAmt,
        payMode: chance(.3) ? 'credit' : 'cash', note: 'Weekly stock'
      });
    }
  });

  /* 7.5) DEMO — wastage entries (fresh maal kharab hona) */
  db.products.forEach(p => {
    const prod = db.production.filter(x => x.productId === p.id).reduce((a, x) => a + num(x.qty), 0);
    if (!prod) return;
    let waste = Math.round(prod * 0.028);
    const reasons = ['Expiry', 'Damage', 'Over-production'];
    while (waste > 0) {
      const q = Math.min(waste, ri(2, Math.max(3, Math.round(waste / 6))));
      db.wastage.push({
        id: uid('w'), date: addDays(start, ri(0, daysBetween(start, TODAY))), vertical: (p.category === 'Store' || p.category === 'Resale') ? 'store' : 'bakery',
        itemType: 'product', itemId: p.id, qty: q, reason: reasons[ri(0, 2)],
        note: '', rate: r2(productCost(p).perPc)
      });
      waste -= q;
    }
  });
  /* demo stock adjust (physical count) */
  db.stockAdj.push({ id: uid('sa'), date: addDays(TODAY, -6), ingId: 'POTATO', type: 'less', qty: 2, reason: 'Physical count', note: 'gaalne se nuksan' });

  /* 7.6) DEMO — orders (kuch pending, kuch partial) */
  const orderDates = [0, 1, 1, 2, 3, 4, 5, 7, 8, 10, 12];
  orderDates.forEach((back, i) => {
    const o = db.parties.filter(p => p.type === 'outlet')[i % 8];
    const items = shuffle(['BREAD', 'PIZZABASE', 'SAMOSA', 'PATTIES', 'BUN', 'COOKIES']).slice(0, ri(1, 3));
    db.orders.push({
      id: uid('ord'), date: addDays(TODAY, -back), partyId: o.id, status: 'open', note: '',
      lines: items.map(pid => {
        const p = byId[pid];
        return { productId: pid, qty: ri(10, 40), rate: supplyRateOf(p) };
      })
    });
  });

  /* 8) demo ke liye 3 items ka stock minimum se niche (reorder alert dikhane ke liye) */
  const demoLow = { POTATO: 0.42, CAKEBOX: 0.55, RES_DRINK: 0.35 };
  Object.keys(demoLow).forEach(k => {
    const ing = db.ingredients.find(i => i.id === k);
    if (ing) ing.opening = r3(num(ing.opening) * demoLow[k]);
  });

  /* 9) invoice numbers for supply sales */
  let inv = 1;
  db.sales.filter(s => s.channel === 'supply').sort((a, b) => a.date < b.date ? -1 : 1)
    .forEach(s => { s.invNo = db.meta.invoicePrefix + String(inv++).padStart(4, '0'); });

  db.sales.sort((a, b) => a.date < b.date ? 1 : -1);
  db.production.sort((a, b) => a.date < b.date ? 1 : -1);
  db.purchases.sort((a, b) => a.date < b.date ? 1 : -1);
  db.expenses.sort((a, b) => a.date < b.date ? 1 : -1);
  db.payments.sort((a, b) => a.date < b.date ? 1 : -1);
}
