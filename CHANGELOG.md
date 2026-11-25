# Changelog

Sabhi badle jaane wale kaam yahan. Format: [Keep a Changelog](https://keepachangelog.com/), version: [SemVer](https://semver.org/).

## [9.2.0] — 2026-11-25 · FINAL PACKAGE

### Changed
- **GitHub ke liye saaf repo:** purane generator scripts (`brand3.py`, `kit3.py`, `ds4.py`, `ds_final.py`) aur purane video assets hata diye — ab sirf current pipeline hai (`brand5.py`, `kit5.py`, `refsheet.py`).
- **Video scripts self-contained:** `docs/video/cinematic.py` me hard-coded `/home/user/...` paths ki jagah `HERE` / `assets/` relative paths; zaroori images + `fredoka.ttf` `docs/video/assets/` me shaamil. `assemble.py` ka default output bhi repo ke andar.
- **Brand scripts bhi self-contained:** `assets/brand5.py`, `assets/kit5.py`, `assets/refsheet.py` repo ke andar se hi chalte hain — `assets/fonts/` (Fredoka + Poppins) aur `assets/art/` (hero + flatlay photos) shaamil. Test: saaf copy me `python3 assets/brand5.py && python3 -c "import kit5" && python3 assets/refsheet.py` — sabhi output **byte-identical**.
- Video + poster, 10 social kit files, dono lockups, app icons, `index.html` — sab final state me.
- App: **461,049 B** · 40 views · 0 error.

## [9.1.2] — 2026-11-25 · LOCKUP ME SAANS

### Fixed
- **`DREAM` box aur `SANDWICH` chipke hue the:** gap galat jagah se naap raha tha (DREAM ki ink se), isliye SANDWICH 5 px tak orange box ke **andar** ghus raha tha. Ab gap **box ke bottom se** naapa jata hai — **23 px saaf hawa** (1400 px lockup par).
- Ink alignment waisa hi perfect: dono words ka left/right edge 0 px difference, icon ka centre = text ka centre.
- Saare 10 social files, dono lockups aur reference sheet dobara generate (`assets/refsheet.py` se reproducible).
- App file unchanged (461,049 B).

## [9.1.1] — 2026-11-25 · ALIGNMENT PIXEL-PERFECT

### Fixed
- **Lockup ink alignment:** ab justification *ink width* par hoti hai (advance width par nahi) — `DREAM` aur `SANDWICH` ke **left aur right edge bilkul ek line par** (difference 0 px, pehle 4 px tha). Orange box ka padding bhi ink se naapa jata hai.
- **Icon vertical centring:** icon ka centre = `DREAM` box se `SANDWICH` tak ka ink centre (difference 0.5 px).
- **Posts me ek hi left line:** FB cover ka lockup 96 → **100** (baaki text 100 par tha), menu card 56 → **60**, IG post ka body 58 → **56** — lockup aur neeche ki saari lines ek column me.
- **Mini lockups (FB post, reel cover):** icon aur uske saath ka `DREAM / SANDWICH` ab ink se centre kiye jate hain (`word_mark()` helper) — pehle 4 px neeche khiske the.
- Reference: `assets/alignment-check.png` — guide lines ke saath proof (green = ink edges, blue = box, yellow = icon height).

## [9.1.0] — 2026-11-25 · ICON SIZE + PATTERN FIX

### Changed
- **Icon ab lockup me thoda bada:** icon ki ink height = `DREAM` + `SANDWICH` text block × **1.10** — text se halka sa bada, pehle barabar dikh raha tha. Icon ab transparent padding ke bina tight crop hota hai (`icon_ink()`), isliye gap aur alignment dono saaf.
- **Pattern theek kiya:** naya **seamless 1024 tile** — 4×4 grid, icon cell ke centre par (kuch bhi cut nahi), beech me orange dot, aur tile ke andar hi wrap ho jata hai. 2×2 me jodne par koi seam nahi (verify: `pattern-preview.png`).
- Brand sheet (10) fix: pattern strip ab poore icons dikhata hai (pehle stretch/squash ho raha tha), `LOCKUP` aur `app icon` labels apni jagah, app-icon row 1024 tile se crisp.
- Menu card me lockup ke neeche thoda aur space.
- Lockup dono variants (dark/light) dobara generate. App file unchanged (461,049 B).

## [9.0.0] — 2026-11-25 · LOCKUP JUSTIFIED

### Changed
- **Lockup justified:** `DREAM` ka letter-spacing calculate ho kar set kiya gaya hai taaki uski **width bilkul `SANDWICH` ke barabar** ho — dono words ke left aur right edges ek line me.
- Orange box ab exactly DREAM ko hug karta hai (padding 30, radius 14).
- Video badge + outro card ka `DREAM SANDWICH` bhi **Fredoka Bold** me (pehle DejaVu tha).
- Social kit ke lockup-wale files refresh: FB cover, FB post, IG post, story, highlight, menu card, brand sheet.
- Video re-render (1:41, 8.5 MB). App unchanged (461,049 B · 40 views · 0 error).
- Reference: `brand/v5/lockup-options.png` (A justified vs B equal-gap).

## [8.0.0] — 2026-11-25 · ICON RESTORED + NEW WORDMARK FONT

### Changed
- **Icon undo:** wapas aapka original `image-3.png` mark (D + spoon/fork + white arc). DS monogram / sandwich-D experiments hata diye.
- **Wordmark font:** Anurati (thin, spaced) → **Fredoka Bold** — garam, friendly lekin premium; chhote size pe bhi strong. Body text Poppins hi hai.
- Lockup dobara bana: icon + `DREAM` (white on orange box) + `SANDWICH`, dono Fredoka Bold me.
- Saare app icons, 10 social kit files, video badge + outro naye mark/font ke saath; video re-render (1:41, 8.4 MB).
- App: favicon + Apple touch + sidebar logo update → 461,049 B · 40 views · 0 error.

## [7.0.0] — 2026-11-25 · SANDWICH-SHAPED D

### Changed — icon
- **D ab sandwich hai:** D ka silhouette teen layers me — **bread · cream filling · bread** (filling thoda andar inset, jaise asli sandwich me hota hai) aur andar **S** knockout.
- Bite / wave-cut / ring experiments reject — chhote size pe D toot raha tha. Final version me D hamesha padhta hai, layers 16 px tak dikhti hain.
- Naye app icons + lockup + saara social kit (10 files).
- App: favicon, Apple touch, sidebar logo update → 458,821 B · 40 views · 0 error.
- Video: badge + outro naye mark ke saath re-render (1:41, 8.4 MB).
- Generator: `assets/ds_final.py` (monogram + app icons + showcase sheet).

## [6.0.0] — 2026-11-25 · DS MONOGRAM REDESIGN

### Changed — icon
- Naya **DS monogram**: rounded **D** ring + solid **S** (Poppins ExtraBold glyph) — concept wahi (D + S), geometry perfect ki gayi (uniform stroke, optical centring, 16 px legibility test pass).
- Spoon/fork wala purana cut hata (chhote size pe blob ban raha tha); food cue ab wordmark + photography + tagline se aata hai.
- Naye app icons (brown tile), naya lockup, saara social kit (10 files) dobara generate.
- App favicon + Apple touch + sidebar logo update → 459,089 B · 40 views · 0 error.
- Video badge + outro card naye monogram ke saath, dobara render (1:41, 8.4 MB).
- `assets/ds4.py` — monogram generator (ek script se saare sizes).

## [5.0.0] — 2026-11-25 · BRAND v3 (dark brown)

### Changed — brand
- **Icon unchanged** — aapka original `D` + spoon/fork mark hi primary icon hai (emblem aur sandwich-glyph experiments retire).
- **Palette refresh:** black → **dark brown `#1D0200`**, orange → `#FB5105`, cream `#FFF7EF`, card `#2B0A05`.
- **Wordmark:** `DREAM` (white on orange box) + `SANDWICH` in **Anurati**, exactly aapke attached reference jaisa.
- Type rule: **Anurati sirf brand naam ke liye**, saara message **Poppins** me (Anurati ka `A` = `Λ` headline me padhne me dikkat deta tha).
- App: naya favicon + Apple touch + sidebar logo (brown tile), `theme-color #1D0200`, accent/ink bhi dark brown.
- Video: badge me naya icon, outro card cream + icon, background dark brown, orange glow; 1:41, 8.5 MB.
- **Social kit v3 (10 files):** profile, FB cover, FB post, IG post, story, reel cover, highlight, pattern, menu card, brand sheet.
- Purane emblem assets hata diye (`logo-emblem.png`, `logo-lockup*.png`, `mark-*.png`).

## [4.0.0] — 2026-11-25 · NEW LOGO

### Changed — brand identity (complete redesign)
- **Naya logo:** double-ring emblem — `DREAM SANDWICH` upar, `BAKERY · STORE` neeche, beech me 3-layer sandwich mark (orange + charcoal) cream disc pe. Purana "S + spoon/fork" mark retire.
- App ke andar naya mark: **favicon** (64), **Apple touch icon** (120) aur **sidebar logo** — sab inline base64, offline.
- Video: top-left badge me naya emblem; end card pe emblem + `DREAM SANDWICH` + `BUSINESS MANAGER`, mascot aur Facebook/Instagram handles same.
- `assets/` poora refresh: `logo-emblem.png`, `logo-lockup(-dark).png`, `icon-512/192/180/64`, `mark-glyph.png`, `mark-cream.png`, `social-icon.png`, naya `social-preview.png` (1280×640).
- `assets/build_brand.py` + `make_social.py` — ek hi master emblem se saare icons aur social banner dobara ban jaate hain.
- README naya logo + lockup + brand asset table.
- Video dobara render: same 1:41 (101.2s), 8.4 MB.
- App build: 467,982 B (icons halke hone se ~12 KB chhota), 40 views · 0 error.

## [3.0.0] — 2026-11-25 · FINAL

### Added — brand
- **Original logo mark** (orange S + spoon/fork) app ke andar: **favicon**, **Apple touch icon** aur **sidebar logo** — sab inline base64, offline chalta hai.
- `assets/` folder: `icon-512/192/180/64`, `logo-mark.png`, `logo.png` (lockup), `mascot.png`, `social-preview.png` (1280×640).
- README me logo header + video poster + brand assets table.
- Video ka top-left badge naya logo mark + wordmark; end card me full lockup + mascot + **@dreamsandwichbetul** links.

### Changed
- `theme-color` #0A0B0D (dark, brand ke saath match).
- Video dobara render (same 1:41, naye badge ke saath).

### Final checklist
- 40 screens · blank + demo · **0 render error**, **TB Dr = Cr ₹0.00**
- 80 view dumps: tag-balance + colspan **0 issue**
- Mobile drawer: open → select → auto close (tested in real DOM)
- `build.sh` rebuild == index.html (byte identical)

## [2.3.0] — 2026-11-25

### Changed
- **Naya cinematic demo video** — `tutorial.mp4` ab **1920×1080 wide, 1 min 41 sec**, dark premium look (orange/mint brand accents, film grain, glow), Hinglish voiceover, 10 chapter.
- **Chhota live-preview thumbnail** (picture-in-picture) har chapter me — full-screen ke andar app ki asli screen ka preview (mobile pe bhi padhne layak), mobile chapter me poora phone mock.
- Brand assets: aapka **original logo + mascot** video me use hua; outro me **@dreamsandwichbetul** (Facebook + Instagram).
- In-app tutorial popup ke chapter times naye video ke hisaab se update.

### Notes
- Video sirf icons/emoji-style flat symbols se explain karta hai — minimalist text, poora detail preview me.
- Source scripts repo ke `docs/video/` me (cinematic.py, scenes.py, assemble.py) — dobara render karna ho to.

## [2.2.0] — 2026-11-25

### Added
- **Professional tutorial video** — `tutorial.mp4` (2 min 31 sec, 1280×720, Hinglish voiceover, 10 chapters, 4.2 MB).
- **In-app video popup** — sidebar ke neeche "🎬 Tutorial dekhein" button + Settings me "Tutorial & help" card. Popup me video player, 10-chapter list aur 6-step quick start. Video file na hone par bhi app normal chalta hai.
- `tutorial-poster.png` thumbnail.

### Note
- Video ke andar **updated popups** dikhaye gaye hain (Combo, Bill-wise payment, Purchase return) — "UPDATED" badge ke saath.
- Chapter 09 sirf mobile menu fix ko dedicate hai (`☰ tap -> drawer -> option select -> menu band`).

## [2.1.0] — 2026-11-25

### Fixed — Mobile menu (☰)
- **Menu item chunte hi sidebar band ho jata hai** (pehle khula reh jata tha) — nav aur tab dono.
- Sidebar ke bahar (scrim) tap karne par drawer band.
- `Esc` key: pehle modal band, phir drawer.
- Phone rotate / window resize par drawer automatic band (bade screen par space nahi khaata).
- Drawer khulte waqt background scroll lock — iOS pe page peeche nahi khisakta.
- Hamburger icon open hone par **✕** ho jata hai + `aria-expanded` (screen reader friendly).

### Fixed — General bugs
- Modal ke bahar tap/click karne par modal band hota hai.
- iOS: input field pe tap karne par page **auto-zoom nahi** hota (16px font rule).
- Phone par numeric field pe **number keypad** khulta hai (`inputmode` auto-detect).
- Phone par modal khulte hi keyboard apne aap nahi khulta — sirf desktop pe auto-focus.
- Modal mobile pe full-screen, header/footer sticky, safe-area ke saath (buttons notch ke neeche nahi chhupte).
- Nav/tab change par scroll saaf (mobile browser address bar ke saath jump nahi).

### Changed — Device / OS support
- `viewport-fit=cover` + `env(safe-area-inset-*)`: iPhone notch, home indicator, Android cutout.
- `100dvh` fallback: mobile browser ke address bar ke saath height sahi.
- Touch devices par bade tap targets (40px), tablet/landscape layout tuning.
- Tables aur tabs me smooth momentum scroll (`-webkit-overflow-scrolling`), overscroll contain.
- `prefers-reduced-motion` support; focus-visible rings keyboard users ke liye.
- `theme-color`, `color-scheme: light`, `apple-mobile-web-app-*` meta tags.
- Purane browsers ke liye safe JS (koi `?.`, `??`, `replaceAll` nahi).

### Added
- GitHub-ready package: README, LICENSE (MIT), CHANGELOG, build.sh, docs, .gitignore, .nojekyll.

## [2.0.0] — 2026-11-25

### Added
- Invoice-wise settlement (bill-wise payment, exact ageing) + bad-debt write-off.
- Combo/bundle products (component-wise stock aur cost).
- Kal ka Plan — demand-based production (14 din average).
- GSTR-1 / HSN summary + CSV export.
- WhatsApp daily summary text, barcode label sheet, CSV bulk import.
- Purchase return, recurring expenses, ingredient ageing (FIFO), audit trail.
- Loyalty points (earn + redeem), Assets & EMI (auto expense), paid leave (L).
- 40 screens total.

### Changed
- Purchase voucher ab negative (return) rows ko sahi handle karta hai — TB hamesha balanced.
- `postingsAll` cache key me write-offs bhi shamil.

## [1.x] — earlier
- Round 1: vendor payment, sales return / credit note, bill discount, round-off.
- Base app: recipe costing, production, sales (bakery/store/supply), udhaar khata, GST bill, stock, staff salary, reports, backup/restore, PIN lock.
