#!/usr/bin/env python3
# Scenes for the Dream Sandwich tutorial video
import math
from PIL import Image, ImageDraw, ImageFilter
from frame_lib import *   # noqa

TOTAL = 10

# ------------------------------------------------------------------ helpers
def hero(img, t, kicker, title, sub, pills, logo=True, fade_out=None, alpha=1.0):
    d = ImageDraw.Draw(img)
    a = 1.0 if fade_out is None else 1 - ease(seg(t, fade_out, fade_out + 0.18))
    if a <= 0.02:
        return
    lay = Image.new('RGB', (W, H), (247, 249, 251))
    ld = ImageDraw.Draw(lay)
    for y in range(H):
        ld.line([(0, y), (W, y)], fill=mix((250, 251, 253), (231, 236, 241), y / H))
    for x in range(0, W, 40):
        ld.line([(x, 0), (x, H)], fill=(242, 245, 248))
    for y in range(0, H, 40):
        ld.line([(0, y), (W, y)], fill=(242, 245, 248))
    cx = W / 2
    y = 150
    if logo:
        s = 84
        paste_shadow(lay, (cx - s / 2, y, cx + s / 2, y + s), r=22, blur=16, alpha=34)
        ld2 = ImageDraw.Draw(lay)
        rr(ld2, (cx - s / 2, y, cx + s / 2, y + s), 22, fill=INK)
        txt(ld2, (cx, y + s / 2), 'DS', f(30, True), WHITE, 'mm')
        y += s + 30
    txt(ld, (cx, y), kicker.upper(), f(11, True), TEAL, 'mm')
    y += 34
    txt(ld, (cx, y), title, f(40, True), INK, 'mm')
    y += 46
    txt(ld, (cx, y), sub, f(15), INK2, 'mm')
    y += 46
    px = cx - (sum(tw(p, f(11, True)) + 34 for p in pills) + 10 * (len(pills) - 1)) / 2
    for i, p in enumerate(pills):
        ap = ease(seg(t, 0.12 + i * 0.09, 0.30 + i * 0.09))
        if ap <= 0:
            continue
        w = tw(p, f(11, True)) + 28
        yy = y + 10 * (1 - ap)
        rr(ld, (px, yy, px + w, yy + 32), 16, fill=WHITE, outline=(222, 227, 232))
        txt(ld, (px + w / 2, yy + 16), p, f(11, True), INK2, 'mm')
        px += w + 10
    img.paste(Image.blend(img, lay, max(0.0, min(1.0, a * alpha))), (0, 0))


def phone(img, x, y, w=286, h=580):
    d = ImageDraw.Draw(img)
    paste_shadow(img, (x, y, x + w, y + h), r=34, blur=20, alpha=52)
    rr(d, (x, y, x + w, y + h), 32, fill=(24, 28, 36), outline=(48, 54, 64))
    sx, sy = x + 9, y + 9
    sw, sh = w - 18, h - 18
    rr(d, (sx, sy, sx + sw, sy + sh), 25, fill=(247, 249, 251))
    return sx, sy, sx + sw, sy + sh


def phone_status(d, box, pct=0.62):
    x0, y0, x1, y1 = box
    txt(d, (x0 + 16, y0 + 16), '9:41', f(8.5, True), INK, 'lm')
    for i in range(4):
        d.rectangle([x1 - 46 + i * 5, y0 + 19 - i * 2, x1 - 43 + i * 5, y0 + 22], fill=INK)
    d.rounded_rectangle([x1 - 22, y0 + 13, x1 - 10, y0 + 21], radius=2, outline=INK)
    d.rectangle([x1 - 20, y0 + 15, x1 - 20 + int(9 * pct), y0 + 19], fill=INK)


def phone_topbar(d, box, title='Dashboard'):
    x0, y0, x1, y1 = box
    d.rectangle([x0, y0 + 26, x1, y0 + 78], fill=WHITE)
    d.line([(x0, y0 + 78), (x1, y0 + 78)], fill=LINE)
    rr(d, (x0 + 12, y0 + 40, x0 + 44, y0 + 64), 7, fill=WHITE, outline=LINE)
    for i in range(3):
        d.line([x0 + 18, y0 + 46 + i * 6, x0 + 38, y0 + 46 + i * 6], fill=INK, width=2)
    txt(d, (x0 + 54, y0 + 46), 'Dream Sandwich', f(9.5, True), INK, 'lm')
    txt(d, (x0 + 54, y0 + 60), 'Is mahine · Bakery · Store', f(7.5), MUT, 'lm')


# ------------------------------------------------------------------ scenes
def scene_1(t):
    """Intro hero"""
    img = BASE_BG.copy()
    hero(img, t, 'Professional demo · 3 minute',
         'Dream Sandwich — Business Manager',
         'Bakery · Store / Stall · Marketing Supply — ek hi file me pura hisaab',
         ['Recipe costing', 'GST bill', 'Udhaar khata', 'Reports', 'Mobile ready'])
    d = ImageDraw.Draw(img)
    cards = [('Bakery', 'Recipe se cost, batch, expiry', AMB),
             ('Store / Stall', 'Counter sale, udhaar, stock', TEAL),
             ('Marketing Supply', 'Order, demand, agent collection', IND)]
    cw = 320
    x = (W - (cw * 3 + 24 * 2)) / 2
    for i, (tt, ss, col) in enumerate(cards):
        ap = ease(seg(t, 0.30 + i * 0.08, 0.46 + i * 0.08))
        if ap <= 0:
            continue
        yy = 470 + 12 * (1 - ap)
        rr(d, (x, yy, x + cw, yy + 96), 12, fill=WHITE, outline=(226, 231, 236))
        d.rectangle([x, yy + 16, x + 3, yy + 40], fill=col)
        txt(d, (x + 18, yy + 24), tt, f(12, True), INK, 'lm')
        txt(d, (x + 18, yy + 48), ss, f(9.5), MUT, 'lm')
        txt(d, (x + 18, yy + 70), '40 screens · offline · auto-save', f(8.5), MUT, 'lm')
        x += cw + 24
    return img

def scene_2(t):
    """Setup"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=8)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Setup / Start', 'Pehle apni dukaan bataiye — 5 step', ['Demo data', '+ Start'])
    steps = [('1', 'Dukaan ka naam aur tagline'), ('2', 'GSTIN aur address'),
             ('3', 'Financial year'), ('4', 'PIN (Owner / Counter)'),
             ('5', 'Ingredients aur rate daalein')]
    cw = (x1 - x0 - 60) / 2
    ch = y1 - y0 - 108
    card(d, box, x0 + 20, y0 + 78, cw, ch, 'Business details', 'Ye bill par chhapta hai')
    for i, (n, s) in enumerate(steps):
        yy = y0 + 138 + i * 34
        rr(d, (x0 + 34, yy - 11, x0 + 56, yy + 11), 6, fill=SOFT)
        txt(d, (x0 + 45, yy), n, f(9.5, True), INK2, 'mm')
        txt(d, (x0 + 66, yy), s, f(10.5), INK2, 'lm')
        d.line([(x0 + 34, yy + 22), (x0 + 20 + cw - 14, yy + 22)], fill=(247, 248, 250))
    card(d, box, x0 + 40 + cw, y0 + 78, cw, ch, 'Blank ya demo?', 'Blank start = factory fresh')
    bx = x0 + 54 + cw
    txt(d, (bx, y0 + 140), 'Blank DB', f(10.5, True), INK, 'lm')
    txt(d, (bx, y0 + 158), 'Aapka asli data, demo ke bina', f(9), MUT, 'lm')
    rr(d, (bx, y0 + 174, bx + 130, y0 + 200), 7, fill=INK)
    txt(d, (bx + 65, y0 + 187), 'Demo load karein', f(9, True), WHITE, 'mm')
    txt(d, (bx, y0 + 226), 'Demo se practice karein, phir', f(9), MUT, 'lm')
    txt(d, (bx, y0 + 242), 'Settings -> sab data mitao.', f(9), MUT, 'lm')
    txt(d, (bx, y0 + 274), 'Sab kuch browser me — koi login nahi', f(9), TEAL, 'lm')
    txt(d, (bx, y0 + 292), 'Data auto-save + backup reminder', f(9), TEAL, 'lm')

    def body(d2, bx, by, bw, bh, tt):
        rows = [('Dukaan ka naam', 'Dream Sandwich'), ('Tagline', 'Fresh bakery · Bhopal'),
                ('GSTIN', '23ABCDE1234F1Z5'), ('Address', 'MP Nagar, Bhopal')]
        for i, (k, v) in enumerate(rows):
            col, row = i % 2, i // 2
            fx = bx + col * (bw / 2 + 6)
            fy = by + row * 54
            txt(d2, (fx, fy), k.upper(), f(7, True), MUT, 'lm')
            rr(d2, (fx, fy + 8, fx + bw / 2 - 6, fy + 32), 6, fill=WHITE, outline=LINE)
            txt(d2, (fx + 8, fy + 20), v, f(9.5), INK, 'lm')
    modal(d, img, box, {'title': 'Business details', 'sub': 'Bill aur report par yahi chhapta hai',
                        'w': 460, 'h': 250, 'body_fn': body, 'foot': ['Save karein'],
                        'badge': 'STEP 1'}, t, appear=0.30)
    toast(img, box, 'Setup save ho gaya', ease(seg(t, 0.72, 0.84)), 'ok')
    cursor(d, img, x1 - 130, y0 + 210, click=seg(t, 0.26, 0.34))
    return img

def scene_3(t):
    """Ingredients -> recipe cost"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    phase_b = t > 0.52
    box = draw_window(img, nav_active=8)
    x0, y0, x1, y1 = box
    if not phase_b:
        page_head(d, box, 'Ingredients & Rate', 'Rate badla? har product ka cost khud badal jayega', ['+ Ingredient'])
        table(d, x0 + 20, y0 + 78, x1 - x0 - 40,
              [('Ingredient', .40, 'l'), ('Unit', .12, 'l'), ('Rate', .20, 'r'), ('Stock', .14, 'r'), ('Vendor', .14, 'l')],
              [('Maida', 'kg', 'Rs 42.00', '299.6', 'Shree Traders'),
               ('Cheeni', 'kg', 'Rs 46.00', '88.0', 'Shree Traders'),
               ('Butter', 'kg', 'Rs 520.00', '24.5', 'Ganesh Dairy'),
               ('Doodh', 'litre', 'Rs 58.00', '76.0', 'Bhopal Dairy'),
               ('Yeast', 'gm', 'Rs 1.20', '1400', 'Packwell')], rowh=30, fill=y1 - 20)
        highlight(d, img, box, (x0 + 20 + (x1 - x0 - 40) * .52, y0 + 118, 78, 26),
                  ease(seg(t, 0.16, 0.26)), 'Rate edit karein', pulse=t * 3)
        # arrow note
        nx = x0 + 22
        rr(d, (nx, y0 + 300, nx + 430, y0 + 366), 10, fill=TEAL_BG, outline=(191, 231, 224))
        txt(d, (nx + 16, y0 + 320), 'Formula engine: rate -> recipe -> per piece cost -> margin', f(10, True), TEAL, 'lm')
        txt(d, (nx + 16, y0 + 340), 'Maida Rs 42 se Rs 46 hua to Bread ka cost khud badal jata hai.', f(9.5), TEAL, 'lm')
    else:
        page_head(d, box, 'Products, Recipe & Cost', 'Har product ka ingredient-wise costing', ['+ Combo', '+ Naya Product'])
        table(d, x0 + 20, y0 + 78, x1 - x0 - 40,
              [('Product', .28, 'l'), ('Sale rate', .14, 'r'), ('Cost', .14, 'r'), ('Margin', .14, 'r'), ('Stock', .14, 'r'), ('Status', .16, 'l')],
              [('Bread 400g', 'Rs 35', 'Rs 21.40', '39%', '90 pc', 'chalu'),
               ('Veg Sandwich', 'Rs 45', 'Rs 27.10', '40%', '38 pc', 'chalu'),
               ('Patties', 'Rs 20', 'Rs 11.85', '41%', '74 pc', 'chalu'),
               ('Cake 500g', 'Rs 210', 'Rs 132.90', '37%', '12 pc', 'chalu'),
               ('Combo: Sandwich + Drink', 'Rs 49', 'Rs 33.59', '31%', 'set', 'NEW')], rowh=30,
              highlight_rows=(4,), fill=y1 - 20)
        highlight(d, img, box, (x0 + 20, y0 + 78 + 20 + 4 * 30, x1 - x0 - 40, 30),
                  ease(seg(t, 0.56, 0.64)) * (1 - seg(t, 0.66, 0.72)), 'Combo cost auto', pulse=t * 3)

        def cbody(d2, bx, by, bw, bh, tt):
            rr(d2, (bx, by, bx + bw, by + 30), 8, fill=WHITE, outline=LINE)
            txt(d2, (bx + 10, by + 15), 'Sandwich + Cold Drink Combo', f(9.5), INK, 'lm')
            txt(d2, (bx + bw - 10, by + 15), 'Rs 49', f(9.5, True), INK, 'rm')
            rows = [('Veg Sandwich', '1 pc', 'Rs 27.10'), ('Cold Drink', '1 pc', 'Rs 12.50')]
            for i, (n, q, c) in enumerate(rows):
                yy = by + 42 + i * 28
                rr(d2, (bx, yy, bx + bw, yy + 24), 7, fill=WHITE, outline=LINE)
                txt(d2, (bx + 10, yy + 12), n, f(9), INK2, 'lm')
                txt(d2, (bx + bw * .60, yy + 12), q, f(9), MUT, 'lm')
                txt(d2, (bx + bw - 10, yy + 12), c, f(9), INK, 'rm')
            yy = by + 104
            rr(d2, (bx, yy, bx + bw, yy + 46), 8, fill=(250, 251, 252), outline=LINE)
            txt(d2, (bx + 12, yy + 14), 'Combo cost', f(8.5), MUT, 'lm')
            txt(d2, (bx + bw - 12, yy + 14), 'Rs 33.59', f(8.5, True), INK, 'rm')
            txt(d2, (bx + 12, yy + 32), 'Profit / combo', f(8.5), MUT, 'lm')
            txt(d2, (bx + bw - 12, yy + 32), 'Rs 15.41', f(8.5, True), POS, 'rm')
        modal(d, img, box, {'title': 'Combo / Bundle', 'sub': 'Do product, ek price — stock dono ka katega',
                            'w': 420, 'h': 250, 'body_fn': cbody, 'foot': ['Save karein'],
                            'badge': 'UPDATED'}, t, appear=0.66)
        toast(img, box, 'Combo saved · profit Rs 15.41', ease(seg(t, 0.87, 0.95)), 'ok')
    if phase_b:
        cursor(d, img, x1 - 170, y0 + 30, click=seg(t, 0.60, 0.68))
    else:
        cursor(d, img, x0 + 320, y0 + 150, click=seg(t, 0.10, 0.18))
    return img


def scene_4(t):
    """Combo popup (updated popup)"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=2)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Products, Recipe & Cost', '13 products · combo included', ['+ Combo'])
    table(d, x0 + 20, y0 + 78, x1 - x0 - 40,
          [('Product', .34, 'l'), ('Unit', .12, 'l'), ('Sale rate', .16, 'r'), ('Cost', .16, 'r'), ('Margin', .12, 'r'), ('', .10, 'r')],
          [('Bread 400g', 'pc', 'Rs 35', 'Rs 21.40', '39%', 'Edit'),
           ('Veg Sandwich', 'pc', 'Rs 45', 'Rs 27.10', '40%', 'Edit'),
           ('Cold Drink', 'pc', 'Rs 20', 'Rs 12.50', '38%', 'Edit'),
           ('Combo: Sandwich + Drink', 'set', 'Rs 49', 'Rs 33.59', '31%', 'Edit')], rowh=30, fill=y1 - 20)

    def body(d2, bx, by, bw, bh, tt):
        rr(d2, (bx, by, bx + bw, by + 34), 8, fill=WHITE, outline=LINE)
        txt(d2, (bx + 10, by + 17), 'Sandwich + Cold Drink Combo', f(10), INK, 'lm')
        txt(d2, (bx + bw - 10, by + 17), 'Rs 49', f(10, True), INK, 'rm')
        rows = [('Veg Sandwich', '1 pc', 'Rs 27.10'), ('Cold Drink', '1 pc', 'Rs 12.50')]
        for i, (n, q, c) in enumerate(rows):
            yy = by + 52 + i * 30
            rr(d2, (bx, yy, bx + bw, yy + 26), 7, fill=WHITE, outline=LINE)
            txt(d2, (bx + 10, yy + 13), n, f(9.5), INK2, 'lm')
            txt(d2, (bx + bw * .62, yy + 13), q, f(9.5), MUT, 'lm')
            txt(d2, (bx + bw - 10, yy + 13), c, f(9.5), INK, 'rm')
        yy = by + 120
        rr(d2, (bx, yy, bx + bw, yy + 52), 8, fill=(250, 251, 252), outline=LINE)
        txt(d2, (bx + 12, yy + 15), 'Combo cost', f(9), MUT, 'lm')
        txt(d2, (bx + bw - 12, yy + 15), 'Rs 33.59', f(9, True), INK, 'rm')
        txt(d2, (bx + 12, yy + 34), 'Selling price', f(9), MUT, 'lm')
        txt(d2, (bx + bw - 12, yy + 34), 'Rs 49.00', f(9, True), INK, 'rm')
    modal(d, img, box, {'title': 'Combo / Bundle', 'sub': 'Do product, ek price — stock dono ka katega',
                        'w': 430, 'h': 300, 'body_fn': body, 'foot': ['Save karein'], 'badge': 'UPDATED'}, t, appear=0.28)
    toast(img, box, 'Combo saved · Sandwich + Cold Drink', ease(seg(t, 0.74, 0.86)), 'ok')
    cursor(d, img, x1 - 96, y0 + 28, click=seg(t, 0.20, 0.28))
    return img


def scene_5(t):
    """Production + kal ka plan"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=1)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Kal ka Plan', 'Pichhle 14 din ki sale + pending order', ['Sab ka batch banayein'])
    tiles(d, box, [('Kal banana hai', '312 pcs', '11 products'), ('Material cost', 'Rs 4,180', 'approx'),
                   ('Pending order', '48 pcs', '3 products', AMB), ('Average sale/din', '274 pcs', '14 din', POS)], top=74)
    table(d, x0 + 20, y0 + 160, x1 - x0 - 40,
          [('Product', .30, 'l'), ('Avg/din', .13, 'r'), ('14 din sale', .14, 'r'), ('Stock', .12, 'r'), ('Banayein', .14, 'r'), ('Cost', .17, 'r')],
          [('Bread 400g', '38.2', '535', '90', '36 pcs', 'Rs 770'),
           ('Veg Sandwich', '22.4', '314', '18', '28 pcs', 'Rs 759'),
           ('Patties', '31.0', '434', '74', '24 pcs', 'Rs 284'),
           ('Cake 500g', '2.1', '29', '12', '6 pcs', 'Rs 797'),
           ('Samosa', '18.6', '260', '30', '18 pcs', 'Rs 214')], rowh=30, highlight_rows=(1,), fill=y1 - 20)
    highlight(d, img, box, (x0 + 20 + (x1 - x0 - 40) * .72, y0 + 180 + 30, (x1 - x0 - 40) * .14, 26),
              ease(seg(t, 0.34, 0.44)), 'Ek click', pulse=t * 3)
    toast(img, box, '5 products ke batch ban gaye · 112 pcs', ease(seg(t, 0.62, 0.74)), 'ok')
    txt(d, (x0 + 24, y1 - 26), 'Batch number, expiry aur labour — sab apne aap', f(9), MUT, 'lm')
    cursor(d, img, x0 + 700, y0 + 195, click=seg(t, 0.30, 0.38))
    return img


def scene_6(t):
    """Sale: discount, round-off, loyalty"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=3)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Counter Sales', 'Bill banayein — discount, round-off, loyalty', ['+ Sale'])
    fx, fy = x0 + 20, y0 + 76
    fw = (x1 - x0 - 52) * 0.60
    fh = y1 - fy - 18
    card(d, box, fx, fy, fw, fh, 'Naya bill — Store / Stall', 'Line-wise discount ya bill discount')
    lines = [('Veg Sandwich', '3', '45.00', '5%', 'Rs 128.25'), ('Cold Drink', '4', '20.00', '0%', 'Rs 80.00')]
    ly = fy + 54
    for i, (n, q, r, dc, amt) in enumerate(lines):
        rr(d, (fx + 14, ly, fx + fw - 14, ly + 30), 7, fill=WHITE, outline=LINE)
        txt(d, (fx + 24, ly + 15), n, f(10), INK, 'lm')
        txt(d, (fx + fw * .50, ly + 15), q, f(10), INK2, 'lm')
        txt(d, (fx + fw * .62, ly + 15), r, f(10), INK2, 'lm')
        txt(d, (fx + fw * .74, ly + 15), dc, f(10), TEAL, 'lm')
        txt(d, (fx + fw - 24, ly + 15), amt, f(10, True), INK, 'rm')
        ly += 36
    rr(d, (fx + 14, ly + 2, fx + 110, ly + 28), 7, fill=WHITE, outline=LINE)
    txt(d, (fx + 62, ly + 15), '+ Item jodein', f(9), INK2, 'mm')
    # payment chips
    py = ly + 46
    txt(d, (fx + 16, py), 'PAYMENT MODE', f(7, True), MUT, 'lm')
    chips = [('Cash', False), ('UPI', True), ('Udhaar', False)]
    cx = fx + 16
    for name, on in chips:
        w = tw(name, f(9, True)) + 26
        rr(d, (cx, py + 12, cx + w, py + 38), 7, fill=(INK if on else WHITE), outline=(None if on else LINE))
        txt(d, (cx + w / 2, py + 25), name, f(9, on), (WHITE if on else INK2), 'mm')
        cx += w + 8
    # customer / loyalty hint
    ay = py + 64
    rr(d, (fx + 14, ay, fx + fw - 14, ay + 58), 8, fill=TEAL_BG, outline=(191, 231, 224))
    txt(d, (fx + 26, ay + 18), 'Anand Sweets · loyalty 60 points', f(9.5, True), TEAL, 'lm')
    txt(d, (fx + 26, ay + 38), 'Use karein to Rs 60 tak bill se kam — max 30%', f(9), TEAL, 'lm')
    # recent bills
    ry2 = ay + 78
    txt(d, (fx + 16, ry2), 'LAST BILLS', f(7, True), MUT, 'lm')
    bills = [('#1043', 'Anand Sweets', 'Rs 188', 'UPI'), ('#1042', 'Walk-in', 'Rs 96', 'Cash'), ('#1041', 'Sharma Kirana', 'Rs 1,240', 'Udhaar')]
    for i, (no, who, amt, mode) in enumerate(bills):
        yy = ry2 + 18 + i * 30
        rr(d, (fx + 14, yy, fx + fw - 14, yy + 26), 7, fill=(250, 251, 252), outline=(240, 242, 245))
        txt(d, (fx + 24, yy + 13), no, f(9, True), INK2, 'lm')
        txt(d, (fx + 70, yy + 13), who, f(9), INK2, 'lm')
        txt(d, (fx + fw - 90, yy + 13), amt, f(9, True), INK, 'rm')
        txt(d, (fx + fw - 24, yy + 13), mode, f(8), MUT, 'rm')
    # right: bill summary card
    sx = fx + fw + 12
    sw = x1 - 20 - sx
    card(d, box, sx, fy, sw, fh, 'Bill summary', 'Auto GST + round-off')
    rows = [('Item total', 'Rs 208.25', MUT, False), ('Item discount', '- Rs 6.75', TEAL, False),
            ('Bill discount', '- Rs 20.00', TEAL, False), ('Loyalty (60 pts)', '- Rs 15.00', TEAL, True),
            ('Round-off', '- Rs 0.25', AMB, True)]
    ry = fy + 58
    for i, (k, v, col, mark) in enumerate(rows):
        txt(d, (sx + 16, ry), k, f(9.5), INK2, 'lm')
        txt(d, (sx + sw - 16, ry), v, f(9.5, True), col, 'rm')
        if mark:
            ap = ease(seg(t, 0.22 + i * 0.10, 0.34 + i * 0.10))
            if ap > 0.02:
                pw = 34
                rr(d, (sx + sw - 16 - tw(v, f(9.5, True)) - pw - 8, ry - 8, sx + sw - 16 - tw(v, f(9.5, True)) - 8, ry + 8), 5, fill=TEAL_BG)
                txt(d, (sx + sw - 16 - tw(v, f(9.5, True)) - pw / 2 - 8, ry), 'AUTO', f(7, True), TEAL, 'mm')
        ry += 26
    d.line([(sx + 16, ry + 2), (sx + sw - 16, ry + 2)], fill=LINE)
    txt(d, (sx + 16, ry + 24), 'Total', f(11, True), INK, 'lm')
    tp = ease(seg(t, 0.54, 0.64))
    txt(d, (sx + sw - 16, ry + 24), 'Rs %d' % int(188), f(20, True), INK, 'rm')
    txt(d, (sx + 16, ry + 44), 'integer bill · GST included', f(8.5), MUT, 'lm')
    rr(d, (sx + 16, fy + fh - 46, sx + sw - 16, fy + fh - 18), 8, fill=INK)
    txt(d, (sx + sw / 2, fy + fh - 32), 'Save & print bill', f(9.5, True), WHITE, 'mm')
    toast(img, box, 'Bill save · Rs 188 · stock update', ease(seg(t, 0.66, 0.78)), 'ok', pos='bl')
    cursor(d, img, sx + sw - 90, fy + fh - 56, click=seg(t, 0.58, 0.66))
    return img

def scene_7(t):
    """Udhaar + bill-wise settlement (updated popup)"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=5)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Credit Ageing', 'Kis party ka kitna paisa — bill wise', ['Write-off', 'Reminder bhejein'])
    tiles(d, box, [('0-15 din', 'Rs 18,240', '5 party'), ('16-30 din', 'Rs 6,410', '3 party', AMB),
                   ('30+ din', 'Rs 3,606', '2 party', RED), ('Kul udhaar', 'Rs 28,256', '8 party')], top=74)
    table(d, x0 + 20, y0 + 160, x1 - x0 - 40,
          [('Party', .34, 'l'), ('Bills', .12, 'r'), ('0-15', .16, 'r'), ('16-30', .16, 'r'), ('30+', .14, 'r'), ('', .14, 'r')],
          [('Sharma Kirana Store', '4', 'Rs 3,698', '-', '-', 'Bill-wise'),
           ('Gupta General Store', '3', 'Rs 2,140', 'Rs 1,260', '-', 'Bill-wise'),
           ('New Bakery Corner', '2', '-', 'Rs 2,600', 'Rs 3,606', 'Bill-wise'),
           ('Anand Sweets', '1', 'Rs 980', '-', '-', 'Bill-wise')], rowh=30, highlight_rows=(0,), fill=y1 - 20)

    def body(d2, bx, by, bw, bh, tt):
        txt(d2, (bx, by), 'SHARMA KIRANA STORE · 4 bills · limit Rs 10,000', f(7.5, True), MUT, 'lm')
        rows = [('INV-1042', '12 Nov', 'Rs 1,240', 'Rs 0', 'Rs 1,240'),
                ('INV-1051', '18 Nov', 'Rs 980', 'Rs 400', 'Rs 580'),
                ('INV-1058', '21 Nov', 'Rs 1,178', 'Rs 0', 'Rs 1,178'),
                ('INV-1063', '23 Nov', 'Rs 700', 'Rs 0', 'Rs 700')]
        cols = [('', .26), ('', .18), ('', .20), ('', .18), ('', .18)]
        table(d2, bx, by + 8, bw, [(c, fr, 'r' if i else 'l') for i, (c, fr) in enumerate(cols)],
              rows, rowh=24, small=True)
        yy = by + 8 + 20 + 4 * 24 + 10
        rr(d2, (bx, yy, bx + bw, yy + 40), 8, fill=(250, 251, 252), outline=LINE)
        txt(d2, (bx + 12, yy + 14), 'Payment entry — Rs 1,240 (UPI)', f(9), INK2, 'lm')
        txt(d2, (bx + 12, yy + 28), 'Invoice: INV-1042 · baaki Rs 1,240 clear', f(8.5), TEAL, 'lm')
    modal(d, img, box, {'title': 'Bill-wise payment', 'sub': 'Paisa kis bill ke against aa raha hai',
                        'w': 470, 'h': 296, 'body_fn': body, 'foot': ['Entry karein'], 'badge': 'UPDATED'}, t, appear=0.30)
    toast(img, box, 'Rs 1,240 received · INV-1042 clear', ease(seg(t, 0.72, 0.84)), 'ok')
    cursor(d, img, x1 - 130, y0 + 320, click=seg(t, 0.24, 0.32))
    return img


def scene_8(t):
    """Purchase + vendor payment + purchase return"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=3)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Purchase & Stock', 'Kharid, stock aur vendor payment — ek jagah', ['+ Naya Purchase'])
    tiles(d, box, [('Is mahine kharid', 'Rs 1,86,400', '18 bill'), ('Raw stock value', 'Rs 62,140', '39 item'),
                   ('Vendor ko dena', 'Rs 38,449', '4 vendor', AMB), ('Purchase return', 'Rs 1,260', '2 entry', RED)], top=74)
    table(d, x0 + 20, y0 + 160, x1 - x0 - 40,
          [('Date', .12, 'l'), ('Vendor', .30, 'l'), ('Bill no', .16, 'l'), ('Items', .16, 'r'), ('Amount', .16, 'r'), ('Mode', .10, 'l')],
          [('18 Nov', 'Shree Traders', 'ST-881', '4', 'Rs 12,400', 'Credit'),
           ('20 Nov', 'Ganesh Dairy', 'GD-221', '2', 'Rs 8,150', 'Cash'),
           ('21 Nov', 'Packwell', 'PW-104', '3', 'Rs 5,120', 'Credit'),
           ('22 Nov', 'Shree Traders (RETURN)', 'ST-882', '1', '- Rs 500', 'Credit')], rowh=30, highlight_rows=(3,), fill=y1 - 20)

    def body(d2, bx, by, bw, bh, tt):
        fields = [('Vendor', 'Shree Traders'), ('Ingredient', 'Maida'), ('Qty (wapas)', '10 kg'), ('Rate', '50'), ('Refund', 'Credit note')]
        for i, (k, v) in enumerate(fields):
            fx = bx + (i % 2) * (bw / 2 + 6)
            fy = by + (i // 2) * 46
            txt(d2, (fx, fy), k.upper(), f(7, True), MUT, 'lm')
            rr(d2, (fx, fy + 8, fx + bw / 2 - 6, fy + 32), 6, fill=WHITE, outline=LINE)
            txt(d2, (fx + 8, fy + 20), v, f(9.5), INK, 'lm')
        yy = by + 100
        rr(d2, (bx, yy, bx + bw, yy + 34), 8, fill=RED_BG, outline=(246, 220, 217))
        txt(d2, (bx + 12, yy + 12), 'Stock -10 kg · Vendor payable - Rs 500', f(9, True), RED, 'lm')
        txt(d2, (bx + 12, yy + 25), 'Purchase, GST aur P&L sab net ho jayega.', f(8.5), RED, 'lm')
    modal(d, img, box, {'title': 'Purchase return', 'sub': 'Kharab maal vendor ko wapas', 'w': 460, 'h': 268,
                        'body_fn': body, 'foot': ['Return save karein'], 'badge': 'UPDATED'}, t, appear=0.30)
    toast(img, box, 'Purchase return saved · stock 10 kg kam', ease(seg(t, 0.74, 0.86)), 'ok')
    cursor(d, img, x1 - 120, y0 + 30, click=seg(t, 0.22, 0.30))
    return img


def scene_9(t):
    """Reports: P&L then GSTR-1/HSN"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=6)
    x0, y0, x1, y1 = box
    if t < 0.5:
        page_head(d, box, 'Profit & Loss', 'Vertical-wise: Bakery · Store · Supply', ['Print'])
        table(d, x0 + 20, y0 + 78, x1 - x0 - 40,
              [('Vertical', .28, 'l'), ('Sale', .18, 'r'), ('Cost', .18, 'r'), ('Kharcha', .16, 'r'), ('Profit', .20, 'r')],
              [('Bakery', 'Rs 1,42,300', 'Rs 78,140', 'Rs 18,200', 'Rs 45,960'),
               ('Store / Stall', 'Rs 1,68,900', 'Rs 1,12,300', 'Rs 22,400', 'Rs 34,200'),
               ('Marketing Supply', 'Rs 35,299', 'Rs 22,100', 'Rs 6,600', 'Rs 6,599'),
               ('Kul', 'Rs 3,46,499', 'Rs 2,12,540', 'Rs 47,300', 'Rs 86,759')], rowh=31, highlight_rows=(3,), fill=y0 + 244)
        tiles(d, box, [('Revenue', 'Rs 3,46,499', 'net GST'), ('Gross profit', 'Rs 1,33,959', '38.6%', POS),
                       ('Net profit', 'Rs 86,759', '25.0%', POS), ('Bad debt', 'Rs 500', 'write-off', RED)], top=250)
    else:
        page_head(d, box, 'GSTR-1 / HSN', 'CA ko dene ke liye ready', ['CSV download', 'Print'])
        tiles(d, box, [('B2B (outlet)', 'Rs 2,04,300', 'tax Rs 10,215', IND), ('B2C (counter)', 'Rs 1,42,199', 'tax Rs 19,040', TEAL),
                       ('Total GST', 'Rs 29,255', 'CGST + SGST'), ('Lines', '1,247', 'is mahine')], top=74)
        table(d, x0 + 20, y0 + 160, x1 - x0 - 40,
              [('HSN', .14, 'l'), ('Description', .34, 'l'), ('Qty', .14, 'r'), ('Rate', .10, 'r'), ('Taxable', .16, 'r'), ('Tax', .12, 'r')],
              [('1905', 'Bread · bun · patties', '3,240', '5%', 'Rs 2,86,140', 'Rs 14,307'),
               ('1905', 'Cake · cookies', '412', '18%', 'Rs 1,24,870', 'Rs 22,477'),
               ('2106', 'Chai / coffee', '860', '5%', 'Rs 21,400', 'Rs 1,070'),
               ('2202', 'Cold drink', '1,090', '28%', 'Rs 18,300', 'Rs 5,124')], rowh=31, highlight_rows=(0, 1), fill=y1 - 20)
        hp = ease(seg(t, 0.68, 0.78))
        highlight(d, img, box, (x1 - 232, y0 + 14, 100, 26), hp, None, pulse=t * 3)
        if hp > 0.02:
            callout(img, x1 - 236, y0 + 27, 'CSV for CA', dx=-92, dy=-9)
    cursor(d, img, x0 + 380, y0 + 210, click=seg(t, 0.44, 0.52))
    return img


def scene_10(t):
    """Mobile drawer demo"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    lx = 96
    txt(d, (lx, 150), 'MOBILE PE', f(11, True), TEAL, 'lm')
    txt(d, (lx, 188), 'Menu chunte hi', f(27, True), INK, 'lm')
    txt(d, (lx, 224), 'menu band.', f(27, True), INK, 'lm')
    points = ['☰ tap  ->  drawer khulta hai', 'Option select  ->  auto band',
              'Bahar tap / Esc  ->  band', 'Number box  ->  number keypad',
              'iPhone notch safe-area', 'Tablet / desktop: fixed sidebar']
    for i, p in enumerate(points):
        ap = ease(seg(t, 0.08 + i * 0.06, 0.24 + i * 0.06))
        if ap <= 0:
            continue
        yy = 276 + i * 36
        d.ellipse([lx, yy - 3, lx + 6, yy + 3], fill=(TEAL if i < 3 else MUT))
        txt(d, (lx + 18, yy), p, f(11.5), INK2, 'lm')
    rr(d, (lx, 508, lx + 300, 560), 8, fill=WHITE, outline=(226, 231, 236))
    txt(d, (lx + 14, 526), 'File download karke browser me kholein', f(9), INK2, 'lm')
    txt(d, (lx + 14, 544), 'tab hi auto-save + backup chalta hai', f(9), MUT, 'lm')
    px, py = 700, 58
    sx, sy, ex, ey = phone(img, px, py, 316, 566)
    d = ImageDraw.Draw(img)
    phone_status(d, (sx, sy, ex, ey))
    d.rounded_rectangle([sx + 118, sy + 10, ex - 118, sy + 22], radius=6, fill=(24, 28, 36))
    phone_topbar(d, (sx, sy, ex, ey))
    cy = sy + 92
    rr(d, (sx + 12, cy, ex - 12, cy + 66), 10, fill=WHITE, outline=LINE)
    txt(d, (sx + 24, cy + 16), 'AAJ KA SALE', f(7, True), MUT, 'lm')
    txt(d, (sx + 24, cy + 38), 'Rs 12,480', f(17, True), INK, 'lm')
    txt(d, (sx + 24, cy + 55), '48 bills · cash + UPI', f(8), MUT, 'lm')
    for i in range(2):
        yy = cy + 78 + i * 62
        rr(d, (sx + 12, yy, ex - 12, yy + 54), 10, fill=WHITE, outline=LINE)
        txt(d, (sx + 24, yy + 16), ['UDHAAR BAKI', 'LOW STOCK'][i], f(7, True), MUT, 'lm')
        txt(d, (sx + 24, yy + 36), ['Rs 28,256', '6 items'][i], f(13, True), INK, 'lm')
    dp = ease(seg(t, 0.24, 0.34)) * (1 - ease(seg(t, 0.62, 0.70)))
    if dp > 0.01:
        ov = Image.new('RGBA', (ex - sx, ey - sy), (17, 24, 39, int(120 * dp)))
        img.paste(Image.alpha_composite(img.crop((sx, sy, ex, ey)).convert('RGBA'), ov).convert('RGB'), (sx, sy))
        dw = 210
        dx = sx - dw + dw * dp
        d = ImageDraw.Draw(img)
        rr(d, (dx, sy + 26, dx + dw, ey), 4, fill=WHITE)
        d.rectangle([dx, sy + 26, dx + 2, ey], fill=INK)
        rr(d, (dx + 14, sy + 44, dx + 44, sy + 74), 8, fill=INK)
        txt(d, (dx + 29, sy + 59), 'DS', f(10, True), WHITE, 'mm')
        txt(d, (dx + 52, sy + 52), 'Dream Sandwich', f(9.5, True), INK, 'lm')
        txt(d, (dx + 52, sy + 66), 'BUSINESS MGR', f(6.5), MUT, 'lm')
        items = ['Dashboard', 'Per Day', 'Bakery', 'Store / Stall', 'Marketing Supply', 'Bahi Khata', 'Reports', 'Expenses & Staff', 'Masters']
        for i, it in enumerate(items):
            yy = sy + 96 + i * 34
            sel = (i == 3 and t > 0.56)
            if sel:
                rr(d, (dx + 8, yy - 12, dx + dw - 8, yy + 14), 7, fill=(243, 244, 246))
                d.rectangle([dx + 8, yy - 8, dx + 10, yy + 10], fill=INK)
            icon_glyph(d, ['dash', 'bill', 'bread', 'cart', 'truck', 'ledger', 'chart', 'exp', 'gear'][i],
                       dx + 18, yy - 5, 10, (INK if sel else (170, 176, 185)))
            txt(d, (dx + 36, yy + 1), it, f(10, sel), (INK if sel else INK2), 'lm')
    if 0.16 < t < 0.34:
        p = seg(t, 0.16, 0.34)
        r = 16 + 10 * p
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).ellipse([sx + 28 - r, sy + 52 - r, sx + 28 + r, sy + 52 + r],
                                   outline=(15, 118, 110, int(210 * (1 - p))), width=3)
        img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'), (0, 0))
    if t > 0.66:
        d = ImageDraw.Draw(img)
        pill = 'Menu band · Store / Stall khul gaya'
        pw = tw(pill, f(9.5, True)) + 20
        rr(d, (sx + 12, ey - 42, sx + 12 + pw, ey - 18), 8, fill=(11, 107, 69))
        txt(d, (sx + 12 + pw / 2, ey - 30), pill, f(9.5, True), WHITE, 'mm')
    return img

def scene_11(t):
    """Backup + outro"""
    img = BASE_BG.copy()
    d = ImageDraw.Draw(img)
    box = draw_window(img, nav_active=8)
    x0, y0, x1, y1 = box
    page_head(d, box, 'Settings & Backup', 'Data browser me rehta hai — backup lena zaroori', ['Backup JSON'])
    items = [('Backup download (JSON)', 'Sab data ek file me'), ('Restore', 'Purana backup wapas'),
             ('Auto snapshot', 'Har 3 din'), ('PIN lock', 'Owner / Counter'),
             ('Audit trail', 'Kis role ne kya kiya'), ('Billing rules', 'Round-off · loyalty')]
    for i, (k, v) in enumerate(items):
        col = i % 2
        row = i // 2
        bx = x0 + 20 + col * ((x1 - x0 - 50) / 2 + 10)
        by = y0 + 82 + row * 62
        rr(d, (bx, by, bx + (x1 - x0 - 50) / 2, by + 52), 9, fill=WHITE, outline=LINE)
        txt(d, (bx + 14, by + 18), k, f(10.5, True), INK, 'lm')
        txt(d, (bx + 14, by + 34), v, f(8.5), MUT, 'lm')
    highlight(d, img, box, (x0 + 20, y0 + 82, (x1 - x0 - 50) / 2, 52), ease(seg(t, 0.18, 0.28)) * (1 - seg(t, 0.62, 0.7)), 'Har mahine', pulse=t * 3)
    toast(img, box, 'Backup file download ho gayi', ease(seg(t, 0.30, 0.42)), 'ok')
    hero(img, seg(t, 0.68, 0.80), 'Dhanyavaad',
         'Dream Sandwich — Business Manager',
         'Ek file · 40 screens · GST + udhaar + stock + staff',
         ['Offline', 'Mobile ready', 'Free · MIT'], logo=True, alpha=ease(seg(t, 0.60, 0.74)))
    return img


SCENES = [scene_1, scene_2, scene_3, scene_5, scene_6, scene_7, scene_8, scene_9, scene_10, scene_11]

CHAPTER_META = [
    ('Intro', 'Dream Sandwich Business Manager'),
    ('Setup', 'Masters -> Setup: dukaan, GSTIN, FY'),
    ('Costing & combo', 'Rate badla to cost auto · combo'),
    ('Production plan', 'Kal ka Plan se batch'),
    ('Sale & bill', 'Discount · round-off · loyalty'),
    ('Udhaar & settlement', 'Bill-wise payment'),
    ('Purchase & return', 'Vendor payment · return'),
    ('Reports', 'P&L · GST · GSTR-1'),
    ('Mobile menu', 'Select -> menu band'),
    ('Backup', 'Mahine me ek baar'),
]


def render_frame(i, t):
    img = SCENES[i](t)
    d = ImageDraw.Draw(img)
    title, cap = CHAPTER_META[i]
    overlay(img, i + 1, TOTAL, title, cap, min(1.0, t), chapter_pill=None)
    return img


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/still'
    os.makedirs(out, exist_ok=True)
    picks = [(0, 0.85), (1, 0.75), (2, 0.30), (2, 0.85), (3, 0.8), (4, 0.8),
             (5, 0.85), (6, 0.85), (7, 0.85), (8, 0.5), (8, 0.8), (9, 0.85)]
    for n, (i, t) in enumerate(picks):
        im = render_frame(i, t)
        im.save('%s/s%02d_%d_%.2f.png' % (out, n, i + 1, t))
    print('stills written to', out)
