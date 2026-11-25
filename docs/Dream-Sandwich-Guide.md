# Dream Sandwich — Business Manager

**File:** `Dream-Sandwich-Business-Manager.html` → download karke double-click karein (install/internet nahi chahiye).
App **bilkul khali** khulta hai — pehle Setup, phir apni entry. Data browser me auto-save hota hai.

---



## 0a. Tutorial video (1 min 41 sec — cinematic)

- App ke **sidebar ke neeche "🎬 Tutorial dekhein"** button, ya **Masters → Settings → Tutorial & help**
- Video me 10 chapter hain: Intro · Setup · Costing & combo · Kal ka Plan · Bill · Udhaar bill-wise · Purchase return · Reports/GST · Mobile menu · Backup
- Har chapter me bada message + **chhota app preview thumbnail** (mobile pe bhi saaf) · outro me @dreamsandwichbetul
- Video file `tutorial.mp4` HTML file ke **saath same folder** me honi chahiye (zip/GitHub se saath aati hai)
- Video na mile to app normal chalta rahega — popup me chapter list + 6-step quick start dikh jata hai

## 0. Mobile / Tablet / Desktop — kaise chalega

- **Phone pe ☰ (3 line) menu**: tap karein → menu khulta hai. Koi bhi option chunte hi **menu apne aap band** ho jata hai aur wahi screen khul jati hai.
- Menu ke bahar tap, ya **Esc** dabane se bhi band. Phone ghumane par bhi menu khud band ho jata hai.
- Menu khula hone par peeche ka page **lock** rehta hai (galti se scroll nahi hota).
- **Number wale box** me tap karein → seedha number keypad khulta hai (qty, rate, amount, EMI).
- **iPhone/iPad**: notch ke aas-paas buttons nahi chhupte, aur input me tap karne par page zoom nahi hota.
- **Bill/Report print**: iPhone pe Share → Print; laptop pe Ctrl/Cmd + P.
- Sabse achha experience: file **download karke browser me kholein** (preview/iframe me data save nahi hota).


## 1. Sabse pehle: Setup (5 step)

File khulte hi **Masters → Setup / Start** khulta hai. Progress bar ke saath 5 step:

| Step | Kya bharna hai | Kahan se |
|---|---|---|
| 1 | Company, address, GSTIN, **opening cash / bank** | "Bhar dein" |
| 2 | **Ingredients + rate** (maida, cheeni, yeast, packaging…) | + Ingredient |
| 3 | **Products + recipe** (bread, samosa, patties… har product ka ingredient + yield) | + Product |
| 4 | **Parties** — Outlet (supply), Retail Customer (udhaar), Vendor | + Party |
| 5 | **Staff & Agents** (salary wale + delivery/collection wale) | + Staff / + Agent |

Pehle dekhna hai ki app kaisa chalta hai? → **"Demo data dekhein"** button (baad me Settings → *Sab data mitao* se blank kar dein).

---

## 2. Per Day — roz ka register + "kya chahiye"

`Per Day → Day Register` (naya)

- Upar se **koi bhi din** chunein (◀ ▶ ya kalendar) — us din ka pura hisaab
- KPI: **Orders aaye · Supply kiye · Total sale · Banaya · Wastage · Cash/UPI/Udhaar**
- 4 table: **Order aaye** (pending, "Supply" button) · **Supply/Bills** (party-wise, bill print) · **Production** · **Kharcha/Wastage/Deposit**
- Neeche **Din-wise Order vs Supply** chart + table (har din: orders, order value, supply qty, sale, production, wastage, kharcha)

`Per Day → Kya Chahiye` (naya) — ye sabse kaam ki screen hai

1. **Production Plan**: pending order ki qty − jo stock hai = **kitna banana hai**, batches + material cost, aur "+ Batch" button (qty pehle se bhari)
2. **Raw Material chahiye**: production plan ka BOM explode karke **kitna chahiye vs kitna stock hai vs kitna kharidna hai** (approx cost + vendor), "Purchase" button (qty pehle se bhari)
3. **Low stock**: minimum se niche wale items + suggested order qty
4. **Finished stock khatam**: kaunsa product khatam hai + 3 din ki avg sale ke hisaab se kitna banayein

## 2b. Per Day → Cash Book (naya)

- **Cash / Bank-UPI** toggle — dono ka alag register
- Din-wise: **Opening → Andar → Bahar → Closing** (running balance)
- Neeche chune hue din ka **detail**: kaunsi sale cash aayi, kaunsa purchase gaya, kharcha, party payment, agent deposit
- Opening balance Settings ke **opening cash / bank** se aata hai

## 2c. Bakery → Batch / Expiry (naya)

- Har batch ka **batch no + expiry date** (product ki **shelf life** se auto: Recipe & Cost me set karein)
- **Expired** list (stock bacha hai, bech nahi sakte) → ek click me **Wastage**
- **2 din me expire** list → pehle bech dein
- **Fresh stock batch-wise** — FIFO (jo pehle bana wo pehle jayega)
- Risk value = expire hone wale maal ki cost

## 3. Monthly Expenses

`Expenses & Staff → Month-wise`

- Mahina chunein (Nov/Oct/Sep…) — us mahine ka **total kharcha**
- **Category wise** table: amount, share %, aur **pichhle mahine se ▲▼** comparison
- **6 mahine ka trend** chart + vertical wise (Bakery/Store/Supply/Common) breakup
- Neeche us mahine ki saari entries (delete bhi kar sakte hain)
- (Wastage alag line me dikhta hai — kyunki wo kharcha nahi, maal ka nuksan hai)

## 4. Roz ke 5 kaam (yahi 90% kaam hai)

| # | Entry | Kahan | Kya hota hai |
|---|---|---|---|
| 1 | **Banaya** (Production) | Bakery → Production → + Batch | Raw material stock kam, finished stock badh |
| 2 | **Becha** (Customer billing) | Bakery/Store → Counter Sales, Supply → Bills | Stock kam, cash/udhaar, GST |
| 3 | **Kharida** (Purchase) | Store → Purchase & Stock | Stock badh, vendor payable |
| 4 | **Kharcha** | Topbar "+ Kharcha" | Vertical-wise P&L me |
| 5 | **Khatam hua** (Wastage) | Store → Wastage & Adjust | Stock kam + profit sahi |

Paisa aaya → Supply → **Payments** → "+ Payment mila".

---

## 5. Marketing Supply — Orders se Bill tak

**Orders tab** (naya):
- Outlet ka order aaya → **+ Naya Order** (party, product, qty, rate)
- Har order pe status: **Pending / Partial / Complete**, aur kitni qty **supply hona baki** hai
- **"Supply karein"** dabao → bill ka form khulta hai, **pending qty pehle se bhari hui** — save karte hi bill ban jata hai aur order update
- (Order optional hai — seedha bill bhi bana sakte hain)

**Demand tab** (naya):
- Party-wise **Ordered / Supplied / Supply Value**
- **Trend** (pichhle period se ▲▼ %) — kiski demand badh rahi hai
- **Kis product ki demand sabse zyada** — kaunsa maal zyada banayein

---

## 6. Store/Stall — customer billing + agent

- **Counter Sales**: ek bill me kai items, Cash / UPI / **Udhaar**
- **Udhaar customer**: Party master me type = *Retail Customer* → bill udhaar karte hi unke khate me jata hai, Bahi Khata me Dr balance
- **Agent / Delivery**: Agents master (Staff ke saath) → bill me agent chunein → uske haath ka cash track hota hai
  - **Payments tab** me: Agent ka *Cash collect / Jama kiya / Haath me baki*, aur **"Jama karein"** button
  - Bahi Khata me har agent ka alag khaata

---

## 7. Wastage & Stock Adjust

**Store → Wastage & Adjust**

- **Wastage**: product ya raw material khatam/expire/damage → qty + reason (Expiry / Damage / Over-production / Customer return)
  - Stock kam hota hai, aur **P&L me "Wastage / Damage"** line aati hai — isliye profit jhootha nahi dikhta
- **Stock Adjust**: mahine ke end me physical count karke stock badhayein/kam karein

Bakery → Production tab me **"Bana / Bika / Bacha"** table: har product kitna bana, counter-store-supply me kitna gaya, wastage kitna, stock kitna bacha.

---

## 8. Bahi Khata — Debit / Credit

`Bahi Khata → Khata / Ledger`

- Khaate ke group: **Cash & Bank · Parties (lena hai) · Agents · Vendors (dena hai) · Income · Expenses · Tax**
- Har khaata: **Opening → entries → Closing** with **Dr / Cr** aur running balance
- Har transaction do jagah post hoti hai:

| Transaction | Debit | Credit |
|---|---|---|
| Cash sale | Cash in Hand | Sales + GST |
| UPI sale | Bank / UPI | Sales + GST |
| Udhaar sale | Party | Sales + GST |
| Agent ke through cash sale | Agent | Sales + GST |
| Purchase (udhaar) | Purchase | Vendor |
| Kharcha | Expense | Cash |
| Payment mila | Cash / Bank | Party |

`Trial Balance` tab: sab khaaton ka joda — **Dr = Cr, difference ₹0** (demo data me ₹11,21,508 = ₹11,21,508 ✓)

---

## 9. Reports

| Report | Kya dikhata hai |
|---|---|
| **Profit & Loss** | Teeno vertical ka alag column: Sales → GST → COGS → Gross → Wastage → Kharche → **Net profit** |
| **Product P&L** | Kaunsa product paisa de raha hai / kha raha hai (margin %) |
| **Udhaar / Party** | Kis party ka kitna baki, limit cross, ledger |
| **Stock** | Raw + finished stock value, low-stock alert, period consumption |
| **GST** | Slab-wise CGST/SGST + net payable |

---

## 9b. Masters → Party Rate List (naya)

- Party chunein → har product ka **apna rate** bharein (khaali chhodein to normal rate)
- Column me **cost, counter rate, supply rate, lagne wala rate aur margin %** dikhta hai
- Bill banate waqt party chunte hi **uska rate auto aa jata hai** (supply ho ya counter)
- Margin red/amber/green me — jo party patla margin de rahi hai turant dikh jata hai

## 10. Formula (recipe costing)

```
Cost / pc = Σ(ingredient qty × rate) ÷ yield ÷ (1 − wastage%) + (labour + overhead) ÷ yield + packaging
Price (auto) = Cost/pc × (1 + markup%) → round up
```
Rate/qty box me: `42*1.05`, `0.25` (250 g), `8%` (batch base ka %), `yq` (1 per pc packaging).

---

## 10b. WhatsApp Reminder + Bill bhejna (naya)

`Reports → Reminders`

- **Baki udhaar sabse upar** — party, phone, kitne din purana bill, limit cross
- **Copy** → message clipboard me (WhatsApp me paste karein)
- **WhatsApp** → `wa.me` link khulta hai, message pehle se bhara hua (phone number party master me bharein)
- **Sabki list copy** → poori udhaar list ek saath
- **Bills** card: last bills ka **text copy** ya seedha WhatsApp + print
- Bill pe **barcode (Code 39)** chhapta hai — bill no se, koi internet nahi chahiye

## 10c. Attendance & Salary (naya)

`Expenses & Staff → Attendance`

- Date chunein (◀ ▶) → har staff ke saamne **P / H / A** dabayein, **OT ghante** likhein
- Neeche **month summary**: Days, Earned, OT, Advance, Paid, **Payable**
- **+ Advance** → advance diya (salary se kat jayega)
- **Pay / Sabki salary pay** → expense entry ban jati hai + "Paid" mark
- Haziri na lagayein to purana *days* field use hota hai (demo me bhi salary dikhti hai)

## 10d. Login — Owner vs Counter (naya)

`Masters → Settings → Login / Role`

- Toggle ON → **app khulte hi login** maangega (Owner PIN default `1234`, Counter `0000`)
- **Owner** = pura access
- **Counter** = sirf Dashboard, Per Day, Bakery, Store, Supply (Reports / Bahi Khata / Settings band)
- Sidebar me **🔒 Lock** button — turant lock

## 10e. Backup reminder + share (naya)

- **Dashboard pe alert**: backup 7 din se nahi liya to upar warning card
- **⬇ Backup file** → JSON download · **📤 Share / WhatsApp** → file share (mobile) ya text copy
- **Auto snapshot**: app khulte hi har 3 din me browser me snapshot (last 3) — galti se data ud jaye to wapas
- **Restore snapshot** → Settings se ek click

## 10f. Thermal bill — 58mm / 80mm (naya)

- Har bill ke saamne **A4 · 58mm · 80mm** buttons
- Thermal receipt me: company, GSTIN, **barcode**, item-wise qty/rate/amount, taxable/CGST/SGST, TOTAL, payment mode, time
- Print dialog me paper 58mm/80mm chunein — receipt printer (counter) seedha chalega

## 10g. Purchase Orders (naya)

`Store → Purchase Orders`

- **+ Naya PO** → vendor, ingredient, qty, rate → **PO/2026-27/0001** number
- Maal aane par **Receive** → purchase bill form khulta hai (pending qty pehle se bhari) → stock + vendor payable auto
- Status: **Pending / Partial / Received**, pending qty har line pe
- **PO print** (vendor ko bhejne ke liye)
- **"Kya chahiye se PO"** → pending order ki requirement se **vendor-wise PO** ek click me ban jaate hain

## 10h. Barcode scan se billing (naya)

- Bill form me sabse upar **🔍 Scan box** — scanner se scan karein ya code/naam likh kar **Enter**
- Har scan par item add / qty **+1**
- Product master me **Barcode / Code** field (khaali chhodein to product ID chalega)

## 10i. Credit Ageing (naya)

`Reports → Ageing`

- Har party ka udhaar **15 / 30 / 60 / 90 din** bucket me — purana paisa turant dikh jata hai
- **Limit cross** hone par upar red warning + party ke naam
- Row me **Copy** (reminder text) · **WA** (WhatsApp) · **Paid** (payment entry)
- Bill banate waqt limit cross ho to sale ke baad warning aati hai

## 10j. Target vs Actual (naya)

- **Dashboard pe 🎯 card**: mahine ki **Sale** aur **Net Profit** target, progress bar, **projection** aur "roz kitna chahiye"
- Target set/change: card ke "Badlein" button se
- Target na ho to card kehta hai "Target set karein"

## 10k. FY Closing (naya)

`Masters → Settings → Financial Year`

- **Closing summary**: Cash, Bank, parties se lena, vendors ko dena, stock value
- **FY close karein** →
  1. purana data ka **archive** browser me (wapas restore button bhi wahi)
  2. vouchers clear, masters safe
  3. Cash/Bank/party balance + **stock** naye saal me opening
  4. naya FY + naya invoice prefix
- Archive list Settings me dikhti hai — `Archive 2026-27` button se wapas

## 10l. Vendor Payment (naya)

`Store → Vendor Payment`

- KPI: total payable, period me diya (cash/UPI split), sabse bada vendor
- Vendor list me **Pay** button → amount pehle se bhara (pura payable)
- Payment karte hi **payable kam**, **cash book me out**, aur **Bahi Khata me Dr Vendor / Cr Cash**
- Payment list se delete bhi kar sakte hain

## 10m. Sales Return / Credit Note (naya)

- Sale screen (Bakery / Store / Supply) me **← Return** button
- Party, product, qty, rate, reason (Damage / Expired / Galat maal / Order cancel)
- **Paisa kaise wapas**: Udhaar kam (party) · Cash · UPI
- Effects: **stock wapas badhta**, **udhaar kam**, **GST kam**, **P&L revenue kam**
- Sales table me entry **RETURN** badge ke saath dikhti hai

## 10n. Discount + Round-off (naya)

- Sale form me har line pe **disc %** column, aur neeche **Bill discount ₹**
- Bill total preview me **item discount, bill discount, round off** alag dikhte hain
- **Round-off**: bill total nearest ₹1 (Settings → Billing Rules me on/off)
- Bill print pe "Discount diya" aur "Bill total round kiya gaya" note

## 10o. Invoice-wise Settlement (bill-wise payment)

- **Reports → Ageing** me har party ke saath **Bill-wise** button
- Party ki sab unpaid bills list hoti hain — invoice no, date, amount, baki
- Jitna paisa aaya utna us bill ke against daalein → payment me **invoice no save** hota hai
- Purane bills pe pro-rata (barabar) allocation bhi chalta hai
- Fayda: "kis bill ka paisa baki hai" ka seedha jawab + ageing exact (0-30 / 31-60 / 60+)

## 10p. Combo / Bundle

- **Products & Recipe → + Combo**
- 2-4 product chunein (jaise Sandwich + Cold Drink) aur ek selling price rakhein
- Cost apne aap components ke cost se jud jata hai → **profit turant dikhta hai**
- Bill par combo **ek line** ki tarah aata hai
- **Stock har component ka katega** (Sandwich 1 + Cold Drink 1)
- Combo ki apni recipe nahi hoti — components hi uska recipe hain

## 10q. Kal ka Plan (demand-based production)

- **Per Day → Kal ka Plan**
- Formula: **pichhle 14 din ki average sale × 1.15 + pending order − aaj ka stock**
- Har product ke saamne "Banayein" qty + material cost
- **+ Batch** se ek product ka batch, ya **Sab ka batch banayein** se sab ek saath
- Batch number, expiry, labour — sab pehle jaisa hi

## 10r. GSTR-1 / HSN Summary

- **Reports → GSTR-1 / HSN**
- **B2B** (outlet, invoice no ke saath) aur **B2C** (counter) alag-alag
- Rate-wise slab: taxable, CGST, SGST
- **HSN-wise** table: HSN code, qty, taxable, tax — CA ko yahi chahiye
- HSN code **Products & Recipe** form me set hota hai (default 1905 bakery)
- **CSV download** → seedha CA / portal me

## 10s. Purchase Return · Write-off · Recurring · Ingredient Ageing

- **Purchase & Stock → ← Return**: kharab maal vendor ko wapas (qty minus, credit/cash refund)
- **Reports → Ageing → Write-off**: jo paisa aayega nahi use **Bad Debt** kharcha bana dein (party udhaar band, P&L me loss)
- **Expenses → + Recurring**: kiraya, bijli, internet — fix din par apne aap expense
- **Batch & Expiry** me **Ingredient Ageing**: sabse purana lot (FIFO) kitne din purana hai
- **Settings → Audit Trail**: kis role ne kya kiya (last 15)

## 10t. Loyalty · Assets & EMI · Leave

- **Loyalty**: Settings → Billing Rules me "points per ₹100". Customer ko bill par points milte hain, agle bill me **max 30% tak use** ho sakte hain (1 point = ₹1)
- **Assets & EMI**: Expenses & Staff → Assets & EMI. Machine/fridge ki EMI har mahine apne aap "Machine Maintenance" kharcha ban jati hai
- **Leave**: Attendance me **L** (paid leave) — salary me pura din count hota hai, A (absent) me nahi
- **Labels**: Masters → Labels (barcode sticker sheet), **Import**: Masters → Import (CSV se ingredients/products/parties)
- **Day Summary**: Per Day → 📤 Summary — WhatsApp pe paste karne layak text (sale, cash/UPI/udhaar, production, kharcha, top products, total udhaar)

## 11. Backup & reset

- **Masters → Settings** → Backup download (JSON), Restore, JSON copy
- **Sab data mitao (blank start)** — pura data delete
- **Demo data load karein** — sample business dekhne ke liye
- Preview iframe me browser storage band ho sakta hai — **file download karke browser me kholein**, tab auto-save chalu.
