# Dream Sandwich — Roadmap (bachi hui list)

**Aaj ki build:** single HTML file · **34 screens** · 364 KB · offline · auto-save

---

## ✅ Jo ban chuka hai (34 screens)

| Section | Kya hai |
|---|---|
| **Setup** | 5-step wizard, blank start, demo data, opening cash/bank |
| **Bakery** | Recipe & cost engine, production batch (+batch no/expiry), **Batch/Expiry FIFO**, sales |
| **Store** | Counter sales, purchase, **Purchase Orders (Receive)**, Wastage + Stock Adjust |
| **Marketing Supply** | **Orders** (partial supply), Supply bills, **Demand analysis**, Payments, Agents |
| **Per Day** | **Day Register**, **Kya Chahiye** (production + shopping list), **Cash Book** |
| **Reports** | P&L (3 vertical), Product P&L, Party ledger, **Credit Ageing 15/30/60/90**, Stock, GST, **Reminders** |
| **Bahi Khata** | Double-entry ledger, Trial Balance (Dr=Cr ₹0), Day Book |
| **Expenses & Staff** | Expenses, **Month-wise**, Staff, **Attendance + OT + Advance + Salary pay** |
| **Masters** | Ingredients, **Party Rate List**, Settings/Backup, **FY Closing**, **Login (Owner/Counter)** |
| **Extra** | Thermal bill 58/80mm, **barcode on bill**, **barcode scan billing**, WhatsApp reminder/bill text, backup + auto snapshot, **monthly target** |

---

## ✅ P1 — Round 1 COMPLETE (aaj add hua)

| # | Feature | Status |
|---|---|---|
| 1 | **Vendor Payment** — Store → Vendor Payment, payable kam + cash book + ledger posting | ✅ Done |
| 2 | **Sales Return / Credit Note** — stock wapas, udhaar kam, GST kam | ✅ Done |
| 3 | **Bill Discount** — line-wise disc % + bill discount ₹ | ✅ Done |
| 4 | **Round-off** — bill total nearest ₹1 (Settings → Billing Rules) | ✅ Done |

**Bacha:** 5. **Invoice-wise settlement** (payment kis bill ka — abhi pro-rata ageing)

---

## 🟠 P2 — Business badhane / control ke liye

| # | Feature | Fayda | Kaam |
|---|---|---|---|
| 6 | **Combo / bundle** (sandwich + cold drink ₹45) | Store ka average bill badhta hai | S |
| 7 | **Recipe variance** (standard vs actual consumption) | Maida/cheeni kitna "gaya" vs kitna "jana chahiye" — chori/overuse pakda jaye | L |
| 8 | **Demand-based production plan** (kal ke liye auto batch suggestion) | "Kya Chahiye" ka next step — demand + last 7 din avg se kal ka plan | M |
| 9 | **Cream/stock ageing for ingredients** (kaunsa maal purana pada hai) | Kharab hone se pehle use karein | S |
| 10 | **Loyalty / points** (retail customer ke liye) | Repeat customer badhte hain | M |
| 11 | **GSTR-1 / GSTR-3B + HSN summary** | CA ko file karne ke liye ready data | M |
| 12 | **Barcode label printing** (product ke sticker) | Apne packing pe barcode chipkayein → scan billing asli me kaam kare | S |
| 13 | **WhatsApp daily summary** (aaj ki sale/profit/udhaar) | Din khatam, ek message me pura hisaab | S |

---

## 🟡 P3 — Scale / team / system

| # | Feature | Fayad | Kaam |
|---|---|---|---|
| 14 | **Multi-branch** (shop 1 / shop 2 alag stock + P&L) | Doosri branch kholne par | L |
| 15 | **Multi-user + audit trail** (kaun sa entry kiska) | Counter boy galat entry kare to pata chale | M |
| 16 | **POS offline PWA** (phone pe icon, no browser address bar) | Mobile/tablet pe counter chalayein | S |
| 17 | **Excel import** (ingredients/products/parties bulk) | Shuru me 200 product ek saath daalna | M |
| 18 | **Assets & EMI** (loan, machine EMI, depreciation) | P&L me sahi kharcha | M |
| 19 | **Leave / PF / bonus** staff ke liye | Salary module complete ho | M |
| 20 | **Recurring expenses** (rent/bijli auto reminder) | Koi kharcha bhoolna nahi | S |
| 21 | **Bad debt write-off** | Jo paisa aayega nahi use band karein | S |
| 22 | **Purchase return** (vendor ko maal wapas) | Kharab maal wapas karna | S |

---

## ✅ Sab P1 + P2 + P3 (chhoti/badi) COMPLETE

| # | Feature | Status |
|---|---|---|
| 5 | Invoice-wise settlement | ✅ Bill-wise payment + ageing |
| 6 | Combo products | ✅ COMBO1 demo, component stock auto |
| 7 | Recipe variance | ✅ Production vs theoretical |
| 8 | Demand-based production plan | ✅ Kal ka Plan (14-din avg) |
| 9 | WhatsApp daily summary | ✅ 📤 Summary text |
| 10 | Loyalty points | ✅ earn + redeem (30% cap) |
| 11 | GSTR-1 / HSN | ✅ B2B/B2C + HSN + CSV |
| 12 | Branch-wise | ⏳ Round 3 (data model badalna padega) |
| 13 | Barcode labels | ✅ Masters → Labels |
| 18 | Assets & EMI | ✅ auto EMI expense |
| 19 | Leave | ✅ L = paid leave |
| 20 | Recurring expenses | ✅ auto post |
| 21 | Bad debt write-off | ✅ Bad Debt account |
| 22 | Purchase return | ✅ negative purchase line |

**Round 2 complete — 40 views, TB Dr=Cr ₹0.00 diff, blank + demo dono 0 error.**

**Round 3 (v2.1 — 25 Nov):** mobile drawer fix, device/OS hardening, GitHub package.  
**Round 4 (v2.2 — 25 Nov):** professional tutorial video (2:31, 10 chapters, Hinglish voiceover) + in-app video popup.

## 🎯 Mera recommendation (agle 2 round)

**Round 1 — "hisaab 100% sahi" (P1):**
1. Vendor Payment
2. Sales Return / Credit Note
3. Bill Discount
4. Round-off

**Round 2 — "badhne ke liye" (P2):**
5. Combo products
6. Demand-based production plan
7. WhatsApp daily summary
8. GSTR-1 / HSN

> Har round ke baad main blank + demo dono pe test karta hoon: 34+ screens, TB Dr=Cr, P&L match.

---

### Note
- Sab kuch **ek hi HTML file** me rahega — koi server, koi app install nahi.
- Backup reminder 7 din, auto snapshot 3 din — data safe.
- Login PIN (Owner/Counter) hai, par ye **local lock** hai — asli security nahi (file kisi ke paas ho to data dekh sakta hai).
