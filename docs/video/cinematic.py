#!/usr/bin/env python3
"""Dream Sandwich — cinematic wide tutorial (1920x1080)."""
import math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import scenes as app_scenes      # existing 1280x720 app mocks

W, H = 1920, 1080
FPS = 15
INK = (29, 2, 0)
WHITE = (255, 255, 255)
GREY = (201, 175, 166)
GREY2 = (150, 118, 108)
ORANGE = (251, 81, 5)
ORANGE_D = (198, 58, 2)
MINT = (43, 229, 166)
CARD = (43, 10, 5)
CARD2 = (54, 15, 8)
LINE = (74, 26, 18)

FD = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
_fc = {}


FREDOKA=os.path.join(ASSETS, 'fonts', 'fredoka.ttf')
def fb(sz):
    fnt=ImageFont.truetype(FREDOKA, sz)
    try: fnt.set_variation_by_name('Bold')
    except Exception: pass
    return fnt

def f(sz, bold=False):
    k = (sz, bold)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FB if bold else FD, sz)
    return _fc[k]


def txt(d, xy, s, font, fill=WHITE, anchor='la', spacing=None):
    d.text(xy, s, font=font, fill=fill, anchor=anchor)


def tw(s, font):
    return font.getbbox(s)[2]


def rr(d, box, r=16, fill=None, outline=None, width=1):
    d.rounded_rectangle(list(box), radius=r, fill=fill, outline=outline, width=width)


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def seg(t, a, b):
    if b <= a:
        return 1.0 if t >= b else 0.0
    return max(0.0, min(1.0, (t - a) / (b - a)))


# ---------------------------------------------------------------- background
def make_bg():
    img = Image.new('RGB', (W, H), INK)
    px = np.zeros((H, W, 3), dtype=np.float32)
    px[:, :] = (29, 2, 0)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # orange glow top-right
    gx, gy = W * 0.88, H * 0.06
    g = np.exp(-(((xx - gx) ** 2 + (yy - gy) ** 2) / (2 * (560 ** 2))))
    px += g[..., None] * np.array([92, 28, 6], dtype=np.float32)
    # mint glow bottom-left
    g2 = np.exp(-(((xx - W * 0.06) ** 2 + (yy - H * 1.02) ** 2) / (2 * (620 ** 2))))
    px += g2[..., None] * np.array([52, 14, 6], dtype=np.float32)
    # vignette
    vx = (xx - W / 2) / (W / 2)
    vy = (yy - H / 2) / (H / 2)
    v = np.clip(1.0 - 0.30 * (vx ** 2 + vy ** 2), 0.55, 1.0)
    px *= v[..., None]
    # subtle grid
    grid = ((xx % 64) < 1) | ((yy % 64) < 1)
    px += grid[..., None] * np.array([5, 5, 6], dtype=np.float32)
    px = np.clip(px, 0, 255).astype(np.uint8)
    img = Image.fromarray(px)
    # film grain (static, subtle)
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 2.6, (H, W, 1)).repeat(3, axis=2)
    arr = np.clip(np.asarray(img, dtype=np.float32) + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


BG = make_bg()

# ---------------------------------------------------------------- icon set
def icon(d, kind, x, y, s, col=ORANGE, col2=None):
    col2 = col2 or col
    if kind == 'bread':
        d.ellipse([x + s * .05, y + s * .18, x + s * .95, y + s * .82], fill=col)
        d.line([x + s * .18, y + s * .62, x + s * .82, y + s * .62], fill=(20, 20, 20), width=max(2, int(s * .06)))
        for i in range(3):
            d.line([x + s * (.28 + i * .18), y + s * .34, x + s * (.24 + i * .18), y + s * .58], fill=(20, 20, 20), width=max(2, int(s * .045)))
    elif kind == 'shop':
        d.rectangle([x + s * .08, y + s * .38, x + s * .92, y + s * .92], fill=col)
        d.polygon([(x, y + s * .38), (x + s * .18, y + s * .12), (x + s * .82, y + s * .12), (x + s, y + s * .38)], fill=col2)
        d.rectangle([x + s * .40, y + s * .60, x + s * .60, y + s * .92], fill=(20, 20, 20))
    elif kind == 'truck':
        d.rectangle([x + s * .02, y + s * .30, x + s * .60, y + s * .72], fill=col)
        d.polygon([(x + s * .60, y + s * .42), (x + s * .82, y + s * .42), (x + s, y + s * .60), (x + s, y + s * .72), (x + s * .60, y + s * .72)], fill=col2)
        d.ellipse([x + s * .10, y + s * .68, x + s * .26, y + s * .84], fill=(240, 240, 240))
        d.ellipse([x + s * .70, y + s * .68, x + s * .86, y + s * .84], fill=(240, 240, 240))
    elif kind == 'percent':
        d.line([x + s * .78, y + s * .18, x + s * .22, y + s * .84], fill=col, width=int(s * .10))
        d.ellipse([x + s * .12, y + s * .14, x + s * .40, y + s * .42], outline=col, width=int(s * .09))
        d.ellipse([x + s * .60, y + s * .58, x + s * .88, y + s * .86], outline=col, width=int(s * .09))
    elif kind == 'rupee':
        d.line([x + s * .30, y + s * .16, x + s * .74, y + s * .16], fill=col, width=int(s * .09))
        d.line([x + s * .30, y + s * .36, x + s * .74, y + s * .36], fill=col, width=int(s * .09))
        d.line([x + s * .44, y + s * .16, x + s * .44, y + s * .86], fill=col, width=int(s * .09))
        d.line([x + s * .44, y + s * .48, x + s * .78, y + s * .86], fill=col, width=int(s * .09))
    elif kind == 'star':
        pts = []
        cx, cy, R, r_ = x + s / 2, y + s / 2, s * .46, s * .19
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            R_ = R if i % 2 == 0 else r_
            pts.append((cx + R_ * math.cos(ang), cy + R_ * math.sin(ang)))
        d.polygon(pts, fill=col)
    elif kind == 'chart':
        d.line([x + s * .10, y + s * .86, x + s * .92, y + s * .86], fill=col, width=int(s * .055))
        d.line([x + s * .10, y + s * .14, x + s * .10, y + s * .86], fill=col, width=int(s * .055))
        for i, h in enumerate([.30, .52, .72]):
            d.rounded_rectangle([x + s * (.24 + i * .22), y + s * (.86 - h), x + s * (.40 + i * .22), y + s * .86], radius=int(s * .03), fill=col2)
    elif kind == 'phone':
        d.rounded_rectangle([x + s * .22, y + s * .04, x + s * .78, y + s * .96], radius=int(s * .12), outline=col, width=int(s * .07))
        d.rectangle([x + s * .34, y + s * .18, x + s * .66, y + s * .74], fill=col2)
        d.ellipse([x + s * .44, y + s * .82, x + s * .56, y + s * .90], fill=col)
    elif kind == 'lock':
        d.rounded_rectangle([x + s * .16, y + s * .44, x + s * .84, y + s * .92], radius=int(s * .08), fill=col)
        d.arc([x + s * .28, y + s * .10, x + s * .72, y + s * .62], 180, 360, fill=col, width=int(s * .10))
    elif kind == 'box':
        d.polygon([(x + s * .5, y + s * .06), (x + s * .94, y + s * .30), (x + s * .5, y + s * .54), (x + s * .06, y + s * .30)], fill=col2)
        d.polygon([(x + s * .06, y + s * .32), (x + s * .5, y + s * .56), (x + s * .5, y + s * .95), (x + s * .06, y + s * .70)], fill=col)
        d.polygon([(x + s * .94, y + s * .32), (x + s * .5, y + s * .56), (x + s * .5, y + s * .95), (x + s * .94, y + s * .70)], fill=col)
    elif kind == 'check':
        d.ellipse([x + s * .04, y + s * .04, x + s * .96, y + s * .96], fill=col)
        d.line([x + s * .28, y + s * .52, x + s * .44, y + s * .68, x + s * .74, y + s * .34], fill=(16, 18, 20), width=int(s * .10), joint='curve')
    elif kind == 'cloud':
        d.ellipse([x + s * .06, y + s * .40, x + s * .52, y + s * .82], fill=col)
        d.ellipse([x + s * .34, y + s * .26, x + s * .86, y + s * .78], fill=col)
        d.ellipse([x + s * .58, y + s * .42, x + s * .96, y + s * .80], fill=col)
        d.rectangle([x + s * .18, y + s * .60, x + s * .82, y + s * .82], fill=col)
    elif kind == 'clock':
        d.ellipse([x + s * .06, y + s * .06, x + s * .94, y + s * .94], outline=col, width=int(s * .08))
        d.line([x + s * .5, y + s * .5, x + s * .5, y + s * .26], fill=col, width=int(s * .07))
        d.line([x + s * .5, y + s * .5, x + s * .70, y + s * .60], fill=col, width=int(s * .07))
    elif kind == 'bill':
        d.rounded_rectangle([x + s * .18, y + s * .06, x + s * .82, y + s * .94], radius=int(s * .06), fill=col)
        for i in range(3):
            d.rectangle([x + s * .28, y + s * (.24 + i * .18), x + s * .72, y + s * (.32 + i * .18)], fill=(20, 20, 20))
    elif kind == 'users':
        d.ellipse([x + s * .10, y + s * .12, x + s * .40, y + s * .42], fill=col)
        d.ellipse([x + s * .52, y + s * .18, x + s * .78, y + s * .44], fill=col2)
        d.rounded_rectangle([x + s * .04, y + s * .48, x + s * .46, y + s * .90], radius=int(s * .12), fill=col)
        d.rounded_rectangle([x + s * .48, y + s * .50, x + s * .86, y + s * .90], radius=int(s * .12), fill=col2)


def chip(d, x, y, kind, label, w=None, h=84, sub=None):
    pad = 22
    label_f = f(23, True)
    ww = w or (tw(label, label_f) + 84 + (tw(sub, f(17)) + 10 if sub else 0))
    rr(d, (x, y, x + ww, y + h), 18, fill=CARD2, outline=LINE, width=1)
    icon(d, kind, x + pad, y + (h - 42) / 2, 42, ORANGE if kind not in ('check',) else MINT,
         MINT if kind in ('chart', 'star', 'check', 'phone') else ORANGE_D)
    tx = x + pad + 42 + 16
    if sub:
        txt(d, (tx, y + h / 2 - 13), label, label_f, WHITE, 'lm')
        txt(d, (tx, y + h / 2 + 14), sub, f(17), GREY, 'lm')
    else:
        txt(d, (tx, y + h / 2), label, label_f, WHITE, 'lm')
    return ww


# ---------------------------------------------------------------- preview card
LOGO = Image.open(os.path.join(ASSETS, 'logo.png')).convert('RGB')
MARK = Image.open(os.path.join(ASSETS, 'mark_t.png')).convert('RGBA')
EMBLEM = Image.open(os.path.join(ASSETS, 'emblem_t.png')).convert('RGBA')
ICON = Image.open(os.path.join(ASSETS, 'icon-dark.png')).convert('RGBA')
ICON_L = Image.open(os.path.join(ASSETS, 'icon-light.png')).convert('RGBA')
MASCOT = Image.open(os.path.join(ASSETS, 'mascot_t.png')).convert('RGBA')
MASCOT = MASCOT.resize((int(MASCOT.width * 1.9), int(MASCOT.height * 1.9)), Image.LANCZOS)

PREVIEW_BOX = (1078, 296, 1808, 707)     # 730 x 411  (16:9)

CROPS = {
    0: (270, 90, 1180, 602),
    1: (486, 210, 1010, 505),
    2: (492, 206, 1014, 500),
    3: (270, 120, 1180, 632),
    4: (795, 165, 1195, 390),
    5: (446, 212, 1034, 543),
    6: (486, 210, 1010, 505),
    7: (240, 190, 1150, 702),
    8: (0, 0, 1280, 720),
    9: (270, 92, 1180, 604),
}


def preview_screen(ch_i, t):
    idx = APP_IDX[ch_i]
    tt = min(t, 0.52) if idx == 9 else t
    img = app_scenes.SCENES[idx](tt).convert('RGB')
    x0, y0, x1, y1 = CROPS[ch_i]
    x0 = max(0, min(img.width - 1, x0)); y0 = max(0, min(img.height - 1, y0))
    x1 = max(x0 + 10, min(img.width, x1)); y1 = max(y0 + 10, min(img.height, y1))
    crop = img.crop((x0, y0, x1, y1))
    bw = PREVIEW_BOX[2] - PREVIEW_BOX[0]
    bh = PREVIEW_BOX[3] - PREVIEW_BOX[1]
    ar = bw / bh
    cw, chh = crop.size
    if cw / chh > ar:
        nw = int(chh * ar); crop = crop.crop(((cw - nw) // 2, 0, (cw + nw) // 2, chh))
    else:
        nh = int(cw / ar); crop = crop.crop((0, (chh - nh) // 2, cw, (chh + nh) // 2))
    return crop.resize((bw, bh), Image.LANCZOS)


_FX = {}


def _fx_glow_shadow(bw, bh):
    key = (bw, bh)
    if key in _FX:
        return _FX[key]
    glow = Image.new('RGBA', (bw + 120, bh + 120), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([60, 60, bw + 60, bh + 60], radius=30, fill=(242, 96, 31, 46))
    glow = glow.filter(ImageFilter.GaussianBlur(34))
    sh = Image.new('RGBA', (bw + 160, bh + 160), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([80, 80, bw + 80, bh + 80], radius=24, fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    _FX[key] = (glow, sh)
    return glow, sh


def _with_alpha(layer, p):
    if p >= 0.999:
        return layer
    out = layer.copy()
    a = out.getchannel('A').point(lambda v: int(v * p))
    out.putalpha(a)
    return out


def paste_preview(img, scene, p, label, box=PREVIEW_BOX):
    if p <= 0.01:
        return
    x0, y0, x1, y1 = box
    scale = 0.985 + 0.015 * p
    bw, bh = int((x1 - x0) * scale), int((y1 - y0) * scale)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    bx0, by0 = int(cx - bw / 2), int(cy - bh / 2)
    glow, sh = _fx_glow_shadow(bw, bh)
    img.paste(_with_alpha(glow, p), (bx0 - 60, by0 - 60), _with_alpha(glow, p))
    img.paste(_with_alpha(sh, p), (bx0 - 80, by0 - 72), _with_alpha(sh, p))
    scr = scene.resize((bw, bh), Image.LANCZOS)
    mask = Image.new('L', (bw, bh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, bw - 1, bh - 1], radius=20, fill=255)
    img.paste(scr, (bx0, by0), mask)
    d = ImageDraw.Draw(img)
    rr(d, (bx0, by0, bx0 + bw, by0 + bh), 20, outline=(255, 255, 255, 60), width=2)
    # window dots
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([bx0 + 16 + i * 16, by0 + 13, bx0 + 25 + i * 16, by0 + 22], fill=c)
    # label above
    if label:
        lf = f(15, True)
        lab = label.upper()
        ww = tw(lab, lf) + 26
        rr(d, (x0, y0 - 40, x0 + ww, y0 - 12), 8, fill=CARD2, outline=LINE)
        d.ellipse([x0 + 10, y0 - 30, x0 + 18, y0 - 22], fill=MINT)
        txt(d, (x0 + 24, y0 - 26), lab, lf, GREY, 'lm')



def draw_phone(img, x, y, w, t):
    """cinematic phone with drawer animation (chapter: mobile)"""
    h = int(w * 2.06)
    d = ImageDraw.Draw(img)
    key = ('phone', w)
    if key not in _FX:
        glow = Image.new('RGBA', (w + 220, h + 220), (0, 0, 0, 0))
        ImageDraw.Draw(glow).rounded_rectangle([110, 110, w + 110, h + 110], radius=60, fill=(242, 96, 31, 60))
        glow = glow.filter(ImageFilter.GaussianBlur(46))
        sh = Image.new('RGBA', (w + 200, h + 200), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([100, 100, w + 100, h + 100], radius=52, fill=(0, 0, 0, 170))
        sh = sh.filter(ImageFilter.GaussianBlur(30))
        _FX[key] = (glow, sh)
    glow, sh = _FX[key]
    img.paste(glow, (x - 110, y - 110), glow)
    img.paste(sh, (x - 100, y - 88), sh)
    rr(d, (x, y, x + w, y + h), 52, fill=(18, 20, 24), outline=(58, 63, 71), width=3)
    sx, sy, sw, shh = x + 12, y + 12, w - 24, h - 24
    rr(d, (sx, sy, sx + sw, sy + shh), 42, fill=(247, 249, 251))
    # status bar
    txt(d, (sx + 26, sy + 26), '9:41', f(15, True), (20, 22, 26), 'lm')
    for i in range(4):
        d.rectangle([sx + sw - 78 + i * 8, sy + 30 - i * 3, sx + sw - 73 + i * 8, sy + 35], fill=(20, 22, 26))
    d.rounded_rectangle([sx + sw - 40, sy + 20, sx + sw - 22, sy + 34], radius=4, outline=(20, 22, 26), width=2)
    d.rectangle([sx + sw - 37, sy + 24, sx + sw - 26, sy + 30], fill=(20, 22, 26))
    # topbar
    ty = sy + 44
    d.rectangle([sx, ty, sx + sw, ty + 78], fill=WHITE)
    d.line([(sx, ty + 78), (sx + sw, ty + 78)], fill=(229, 231, 235))
    rr(d, (sx + 20, ty + 20, sx + 62, ty + 58), 10, fill=WHITE, outline=(226, 229, 234))
    for i in range(3):
        d.line([sx + 28, ty + 30 + i * 8, sx + 54, ty + 30 + i * 8], fill=(20, 22, 26), width=3)
    txt(d, (sx + 76, ty + 30), 'Dream Sandwich', f(15, True), (20, 22, 26), 'lm')
    txt(d, (sx + 76, ty + 50), 'Is mahine · Bakery · Store', f(12), (140, 148, 158), 'lm')
    # cards
    cy = ty + 92
    rr(d, (sx + 18, cy, sx + sw - 18, cy + 96), 14, fill=WHITE, outline=(229, 231, 235))
    txt(d, (sx + 36, cy + 24), 'AAJ KA SALE', f(11, True), (140, 148, 158), 'lm')
    txt(d, (sx + 36, cy + 56), 'Rs 12,480', f(26, True), (20, 22, 26), 'lm')
    txt(d, (sx + 36, cy + 80), '48 bills · cash + UPI', f(12), (140, 148, 158), 'lm')
    for i, (lab, val) in enumerate([('UDHAAR BAKI', 'Rs 28,256'), ('LOW STOCK', '6 items')]):
        yy = cy + 112 + i * 88
        rr(d, (sx + 18, yy, sx + sw - 18, yy + 76), 14, fill=WHITE, outline=(229, 231, 235))
        txt(d, (sx + 36, yy + 22), lab, f(11, True), (140, 148, 158), 'lm')
        txt(d, (sx + 36, yy + 50), val, f(21, True), (20, 22, 26), 'lm')
    # drawer
    dp = ease(seg(t, 0.10, 0.28)) * (1 - ease(seg(t, 0.62, 0.74)))
    if dp > 0.01:
        ov = Image.new('RGBA', (sw, shh), (17, 24, 39, int(120 * dp)))
        img.paste(Image.alpha_composite(img.crop((sx, sy, sx + sw, sy + shh)).convert('RGBA'), ov).convert('RGB'), (sx, sy))
        d = ImageDraw.Draw(img)
        dw = int(sw * 0.74)
        dx = int(sx - dw + dw * dp)
        rr(d, (dx, sy, dx + dw, sy + shh), 0, fill=WHITE)
        d.rectangle([dx, sy, dx + dw, sy + shh], fill=WHITE)
        d.rectangle([dx + dw - 1, sy, dx + dw, sy + shh], fill=(226, 229, 234))
        rr(d, (dx + 22, sy + 60, dx + 70, sy + 108), 14, fill=(17, 24, 39))
        txt(d, (dx + 46, sy + 84), 'DS', f(17, True), WHITE, 'mm')
        txt(d, (dx + 82, sy + 72), 'Dream Sandwich', f(14, True), (20, 22, 26), 'lm')
        txt(d, (dx + 82, sy + 92), 'BUSINESS MANAGER', f(9), (150, 156, 166), 'lm')
        items = ['Dashboard', 'Per Day', 'Bakery', 'Store / Stall', 'Marketing Supply', 'Bahi Khata', 'Reports', 'Expenses & Staff', 'Masters']
        ic = ['dash', 'bill', 'bread', 'cart', 'truck', 'ledger', 'chart', 'exp', 'gear']
        for n2, it in enumerate(items):
            yy = sy + 136 + n2 * 46
            sel = (n2 == 3 and t > 0.52)
            if sel:
                rr(d, (dx + 12, yy - 16, dx + dw - 12, yy + 20), 10, fill=(243, 244, 246))
                d.rectangle([dx + 12, yy - 10, dx + 15, yy + 14], fill=(20, 22, 26))
            app_scenes.icon_glyph(d, ic[n2], dx + 26, yy - 7, 14, ((20, 22, 26) if sel else (176, 182, 191)))
            txt(d, (dx + 52, yy + 2), it, f(14, sel), ((20, 22, 26) if sel else (80, 88, 99)), 'lm')
    # tap ripple on hamburger
    if 0.02 < t < 0.24:
        pp = seg(t, 0.02, 0.24)
        r = 18 + 16 * pp
        ov = Image.new('RGBA', (w + 200, h + 200), (0, 0, 0, 0))
        ImageDraw.Draw(ov).ellipse([100 + 62 - r, 100 + ty + 20 - r + 30, 100 + 62 + r, 100 + ty + 20 + r + 30],
                                   outline=(242, 96, 31, int(220 * (1 - pp))), width=4)
        img.paste(Image.alpha_composite(img.crop((x - 100, y - 100, x - 100 + ov.width, y - 100 + ov.height)).convert('RGBA'), ov).convert('RGB') if False else img, (0, 0))
        d = ImageDraw.Draw(img)
        d.ellipse([sx + 62 - r, ty + 20 + 19 - r, sx + 62 + r, ty + 20 + 19 + r],
                  outline=(242, 96, 31, int(220 * (1 - pp))), width=4)
    # after pill
    if t > 0.72:
        pil = 'Menu band · Store / Stall khul gaya'
        pf = f(13, True)
        pw2 = tw(pil, pf) + 26
        rr(d, (sx + 18, sy + shh - 60, sx + 18 + pw2, sy + shh - 22), 12, fill=(11, 107, 69))
        txt(d, (sx + 18 + pw2 / 2, sy + shh - 41), pil, pf, WHITE, 'mm')
    return x, y, w, h


# ---------------------------------------------------------------- chrome
def chrome(d, img, ch_i, total, prog, kicker, lab):
    # brand badge: emblem + wordmark
    em = ICON.resize((66, 66), Image.LANCZOS)
    img.paste(em, (118, 52), em)
    d2 = ImageDraw.Draw(img)
    txt(d2, (198, 78), 'DREAM SANDWICH', fb(22), WHITE, 'lm')
    txt(d2, (199, 102), 'BUSINESS MANAGER', f(12, True), (150, 158, 168), 'lm')
    # chapter right
    lf = f(16, True)
    ww = tw(lab, lf) + 34
    rr(d, (W - 120 - ww, 68, W - 120, 110), 10, fill=CARD2, outline=LINE)
    txt(d, (W - 120 - ww / 2, 89), lab, lf, GREY, 'mm')
    # kicker
    txt(d, (132, 232), kicker.upper(), f(17, True), ORANGE, 'lm')
    # progress
    d.rectangle([0, H - 6, W, H], fill=(28, 30, 34))
    d.rectangle([0, H - 6, int(W * prog), H], fill=ORANGE)


# ---------------------------------------------------------------- chapters
APP_IDX = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9]

CH = [
    dict(k='DREAM SANDWICH · BUSINESS MANAGER',
         t=['Poora hisaab.', 'Ek file.'],
         chips=[('bread', 'Bakery'), ('shop', 'Store / Stall'), ('truck', 'Supply')],
         prev='Live app · dashboard', pt=0.75),
    dict(k='01 · SETUP',
         t=['Shuru teen', 'step me.'],
         chips=[('bill', 'Naam + GSTIN'), ('clock', 'Financial year'), ('lock', 'PIN lock')],
         prev='Masters → Setup', pt=0.8),
    dict(k='02 · COSTING',
         t=['Rate badla,', 'cost khud.'],
         chips=[('box', 'Combo auto'), ('percent', 'Margin live'), ('chart', 'Recipe cost')],
         prev='Ingredients → Products', pt=0.85),
    dict(k='03 · PRODUCTION',
         t=['Kal ka plan', 'aaj pata.'],
         chips=[('clock', '14-din average'), ('check', 'Ek click batch'), ('bread', 'Expiry auto')],
         prev='Per Day → Kal ka Plan', pt=0.8),
    dict(k='04 · BILLING',
         t=['Bill dus', 'second me.'],
         chips=[('percent', 'Discount'), ('rupee', 'Round-off'), ('star', 'Loyalty')],
         prev='Sale → Bill summary', pt=0.8),
    dict(k='05 · UDHAAR',
         t=['Kis bill ka', 'paisa baki?'],
         chips=[('bill', 'Bill-wise'), ('clock', 'Ageing'), ('check', 'Write-off')],
         prev='Ageing → Bill-wise payment', pt=0.85),
    dict(k='06 · PURCHASE',
         t=['Kharid, return,', 'payment.'],
         chips=[('truck', 'Vendor pay'), ('box', 'Return'), ('chart', 'Stock auto')],
         prev='Purchase & Stock', pt=0.85),
    dict(k='07 · REPORTS',
         t=['CA ko CSV.', 'Aapko munafa.'],
         chips=[('chart', 'P&L'), ('percent', 'GST'), ('bill', 'GSTR-1 / HSN')],
         prev='Reports → GSTR-1', pt=0.85),
    dict(k='08 · MOBILE',
         t=['Menu chunte hi', 'band.'],
         chips=[('phone', '☰ drawer'), ('check', 'Select → close'), ('lock', 'Notch safe')],
         prev='Mobile · 360 px', pt=0.78),
    dict(k='09 · START',
         t=['Aaj hi shuru', 'karein.'],
         chips=[('cloud', 'Backup'), ('check', 'Free · MIT'), ('users', 'Owner + Counter')],
         prev='Settings → Backup', pt=0.85),
]


def frame(i, t):
    img = BG.copy()
    d = ImageDraw.Draw(img)
    c = CH[i]
    total = len(CH)

    # kicker
    txt(d, (132, 236), c['k'], f(17, True), ORANGE, 'lm')

    # title lines (slide up + fade)
    tf = f(76, True)
    y = 296
    for n, line in enumerate(c['t']):
        p = ease(seg(t, 0.06 + n * 0.07, 0.22 + n * 0.07))
        if p <= 0.01:
            y += 88
            continue
        dy = 26 * (1 - p)
        col = WHITE if n == 0 else (230, 232, 236)
        txt(d, (132, y + dy), line, tf, col, 'lm')
        y += 88

    # underline accent
    up = ease(seg(t, 0.30, 0.46))
    if up > 0.01:
        d.rounded_rectangle([132, y + 6, 132 + int(150 * up), y + 12], radius=3, fill=ORANGE)

    # chips
    cy = y + 62
    cx = 132
    for n, (k, label) in enumerate(c['chips']):
        p = ease(seg(t, 0.34 + n * 0.08, 0.50 + n * 0.08))
        if p <= 0.01:
            continue
        dy = 22 * (1 - p)
        ww = chip(d, cx, cy + dy, k, label)
        cx += ww + 14

    # preview
    pv = ease(seg(t, 0.12, 0.42))
    if i == 8:
        if pv > 0.01:
            pw_ = 356
            px_ = 1244
            py_ = 214
            draw_phone(img, px_, py_, pw_, max(0.02, min(0.999, (t - 0.02) / 0.96)))
            d = ImageDraw.Draw(img)
            lf = f(15, True)
            lab = c['prev'].upper()
            ww = tw(lab, lf) + 26
            rr(d, (px_, py_ - 40, px_ + ww, py_ - 12), 8, fill=CARD2, outline=LINE)
            d.ellipse([px_ + 10, py_ - 30, px_ + 18, py_ - 22], fill=MINT)
            txt(d, (px_ + 24, py_ - 26), lab, lf, GREY, 'lm')
    else:
        fade = ease(seg(t, 0.58, 0.72)) if i == 9 else 0.0
        if pv > 0.01 and fade < 0.99:
            scr = preview_screen(i, max(0.0, min(1.0, (t - 0.05) / 0.9)))
            float_y = math.sin(t * math.pi * 1.4) * 4
            box = (PREVIEW_BOX[0], int(PREVIEW_BOX[1] + float_y), PREVIEW_BOX[2], int(PREVIEW_BOX[3] + float_y))
            paste_preview(img, scr, pv * (1 - fade), c['prev'], box)
        if i == 9 and fade > 0.02:
            # end card: big logo + handle
            d2 = ImageDraw.Draw(img)
            bw = PREVIEW_BOX[2] - PREVIEW_BOX[0]
            bh = PREVIEW_BOX[3] - PREVIEW_BOX[1]
            cx = (PREVIEW_BOX[0] + PREVIEW_BOX[2]) / 2
            cy = (PREVIEW_BOX[1] + PREVIEW_BOX[3]) / 2
            sc = 0.82 + 0.18 * fade
            cw, chh = int(bw * sc), int(bh * sc)
            bx0, by0 = int(cx - cw / 2), int(cy - chh / 2)
            sh = Image.new('RGBA', (cw + 140, chh + 140), (0, 0, 0, 0))
            ImageDraw.Draw(sh).rounded_rectangle([70, 70, cw + 70, chh + 70], radius=30, fill=(0, 0, 0, int(150 * fade)))
            sh = sh.filter(ImageFilter.GaussianBlur(28))
            img.paste(sh, (bx0 - 70, by0 - 62), sh)
            card = Image.new('RGBA', (cw, chh), (0, 0, 0, 0))
            cd = ImageDraw.Draw(card)
            cd.rounded_rectangle([0, 0, cw - 1, chh - 1], radius=26, fill=(255, 247, 239, int(255 * fade)))
            es = int(chh * 0.46)
            lg2 = ICON_L.resize((es, es), Image.LANCZOS)
            card.paste(lg2, (int(cw / 2 - es / 2), int(chh * 0.11)), lg2)
            cd.text((cw / 2, chh * 0.66), 'DREAM SANDWICH', font=fb(30),
                    fill=(29, 2, 0, int(255 * fade)), anchor='mm')
            cd.text((cw / 2, chh * 0.79), 'B U S I N E S S   M A N A G E R', font=f(12, True),
                    fill=(251, 81, 5, int(255 * fade)), anchor='mm')
            img.paste(card, (bx0, by0), card)

    # outro extras
    if i == 9 and t > 0.52:
        p = ease(seg(t, 0.55, 0.75))
        d = ImageDraw.Draw(img)
        # social handles
        s1 = 'facebook.com/dreamsandwichbetul'
        s2 = 'instagram.com/dreamsandwichbetul'
        yb = 830
        rr(d, (132, yb - 26, 132 + tw(s1, f(21, True)) + 74, yb + 26), 14, fill=CARD2, outline=LINE)
        d.ellipse([150, yb - 11, 172, yb + 11], fill=(24, 119, 242))
        txt(d, (161, yb - 1), 'f', f(17, True), WHITE, 'mm')
        txt(d, (188, yb), s1, f(21, True), WHITE, 'lm')
        yb2 = yb + 66
        rr(d, (132, yb2 - 26, 132 + tw(s2, f(21, True)) + 74, yb2 + 26), 14, fill=CARD2, outline=LINE)
        d.rounded_rectangle([150, yb2 - 11, 172, yb2 + 11], radius=6, fill=(225, 48, 108))
        d.ellipse([157, yb2 - 5, 165, yb2 + 3], outline=WHITE, width=2)
        d.ellipse([167, yb2 - 8, 170, yb2 - 5], fill=WHITE)
        txt(d, (188, yb2), s2, f(21, True), WHITE, 'lm')

    # brand icon bottom-right accent (replaces old mascot)
    if i == 9:
        mp = ease(seg(t, 0.66, 0.84))
        if mp > 0.01:
            s_ic = int(132 + 14 * mp)
            ic2 = ICON.resize((s_ic, s_ic), Image.LANCZOS)
            ic2.putalpha(ic2.getchannel('A').point(lambda v: int(v * mp)))
            img.paste(ic2, (1600, 800), ic2)

    # bottom-left fact strip
    if i < 8:
        fp = ease(seg(t, 0.5, 0.66))
        if fp > 0.01:
            d = ImageDraw.Draw(img)
            facts = ['40 screens', 'Offline', 'GST + GSTR-1', 'Auto-save']
            fy0 = cy + 84 + 30
            fx = 132
            for n, ft in enumerate(facts):
                ff = f(16, True)
                ww = tw(ft, ff) + 34
                rr(d, (fx, fy0, fx + ww, fy0 + 42), 12, fill=CARD, outline=(52, 57, 64))
                d.ellipse([fx + 13, fy0 + 15, fx + 21, fy0 + 23], fill=ORANGE if n % 2 == 0 else MINT)
                txt(d, (fx + 28, fy0 + 21), ft, ff, (206, 210, 216), 'lm')
                fx += ww + 12

    # chrome on top
    proceed = sum(1 for _ in range(10))
    lab = 'INTRO' if i == 0 else '%02d / 09' % i
    chrome(d, img, i, len(CH), min(1.0, (i + t) / len(CH)), c['k'], lab)
    return img


def render_frame(i, t):
    return frame(i, t)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/stillc'
    os.makedirs(out, exist_ok=True)
    for i in range(len(CH)):
        for t in (0.55, 0.95):
            frame(i, t).save('%s/c%02d_%.data.png'.replace('.data', '2f') % (out, i + 1, t))
    print('stills in', out)
