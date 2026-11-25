#!/usr/bin/env python3
# Dream Sandwich — Business Manager : tutorial video renderer
# Draws an animated app mock in PIL and (later) muxes with narration.
import os, math, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 720
FPS = 15

INK = (17, 24, 39)
INK2 = (75, 85, 99)
MUT = (156, 163, 175)
LINE = (229, 231, 235)
LINE2 = (241, 242, 244)
WHITE = (255, 255, 255)
SOFT = (243, 244, 246)
TEAL = (15, 118, 110)
TEAL_BG = (240, 253, 250)
POS = (6, 118, 71)
POS_BG = (240, 249, 244)
AMB = (181, 71, 8)
AMB_BG = (255, 250, 235)
RED = (180, 35, 24)
RED_BG = (254, 243, 242)
IND = (55, 48, 163)
IND_BG = (238, 242, 255)
GOLD = (146, 108, 22)

FD = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
_fc = {}


def f(sz, bold=False):
    k = (sz, bold)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FB if bold else FD, sz)
    return _fc[k]


def txt(d, xy, s, font, fill=INK, anchor='la'):
    d.text(xy, s, font=font, fill=fill, anchor=anchor)


def tw(s, font):
    return font.getbbox(s)[2]


def rr(d, box, r=10, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill, outline=outline, width=width)


_sc = {}


def shadow_layer(w, h, r, blur, alpha):
    k = (w, h, r, blur, alpha)
    if k not in _sc:
        im = Image.new('RGBA', (w + blur * 2, h + blur * 2), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        dd.rounded_rectangle([blur, blur, blur + w, blur + h], radius=r, fill=(16, 24, 40, alpha))
        _sc[k] = im.filter(ImageFilter.GaussianBlur(blur))
    return _sc[k]


def paste_shadow(img, box, r=12, blur=14, alpha=26):
    x0, y0, x1, y1 = box
    sh = shadow_layer(int(x1 - x0), int(y1 - y0), r, blur, alpha)
    img.paste(sh, (int(x0) - blur, int(y0) - blur), sh)


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def seg(t, a, b):
    """normalised progress between a and b"""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return max(0.0, min(1.0, (t - a) / (b - a)))


def mix(c1, c2, p):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * p) for i in range(3))


def bg_canvas():
    im = Image.new('RGB', (W, H), (247, 249, 251))
    d = ImageDraw.Draw(im)
    for y in range(H):
        p = y / H
        d.line([(0, y), (W, y)], fill=mix((248, 250, 252), (233, 238, 243), p))
    # faint grid
    for x in range(0, W, 40):
        d.line([(x, 0), (x, H)], fill=(240, 243, 246))
    for y in range(0, H, 40):
        d.line([(0, y), (W, y)], fill=(240, 243, 246))
    return im


BASE_BG = bg_canvas()

# ---------------------------------------------------------------- window mock
WIN = (72, 52, 1208, 640)
SIDE_W = 188
TITLE_H = 34

NAV_DEF = [
    ('Dashboard', 'dash'), ('Per Day', 'bill'), ('Bakery', 'bread'), ('Store / Stall', 'cart'),
    ('Marketing Supply', 'truck'), ('Bahi Khata', 'ledger'), ('Reports', 'chart'),
    ('Expenses & Staff', 'exp'), ('Masters', 'gear')
]


def icon_glyph(d, kind, x, y, s=11, col=MUT):
    if kind == 'dash':
        for i in range(2):
            for j in range(2):
                d.rectangle([x + i * 6, y + j * 6, x + i * 6 + 4, y + j * 6 + 4], fill=col)
    elif kind == 'bill':
        d.rectangle([x, y + 1, x + s, y + s - 2], outline=col, width=1)
        d.line([x + 3, y + 5, x + s - 3, y + 5], fill=col)
        d.line([x + 3, y + 8, x + s - 5, y + 8], fill=col)
    elif kind == 'bread':
        d.ellipse([x, y + 1, x + s, y + s - 3], outline=col, width=1)
        d.line([x + 2, y + 9, x + s - 2, y + 9], fill=col)
    elif kind == 'cart':
        d.line([x, y + 2, x + 2, y + 2, x + 4, y + 9, x + s, y + 9], fill=col)
        d.ellipse([x + 4, y + 10, x + 6, y + 12], fill=col)
        d.ellipse([x + s - 3, y + 10, x + s - 1, y + 12], fill=col)
    elif kind == 'truck':
        d.rectangle([x, y + 3, x + 7, y + 9], outline=col, width=1)
        d.rectangle([x + 7, y + 5, x + s, y + 9], outline=col, width=1)
        d.ellipse([x + 2, y + 9, x + 4, y + 11], fill=col)
        d.ellipse([x + 8, y + 9, x + 10, y + 11], fill=col)
    elif kind == 'ledger':
        d.rectangle([x, y + 1, x + s, y + s - 1], outline=col, width=1)
        d.line([x + 4, y + 1, x + 4, y + s - 1], fill=col)
        for i in range(3):
            d.line([x + 6, y + 4 + i * 3, x + s - 2, y + 4 + i * 3], fill=col)
    elif kind == 'chart':
        d.line([x, y + s, x, y + 2], fill=col)
        d.line([x, y + s, x + s, y + s], fill=col)
        d.rectangle([x + 2, y + 6, x + 4, y + s - 1], fill=col)
        d.rectangle([x + 6, y + 3, x + 8, y + s - 1], fill=col)
        d.rectangle([x + 9, y + 8, x + 11, y + s - 1], fill=col)
    elif kind == 'exp':
        d.rectangle([x, y + 2, x + s, y + s], outline=col, width=1)
        d.line([x, y + 6, x + s, y + 6], fill=col)
    elif kind == 'gear':
        d.ellipse([x + 2, y + 2, x + s - 2, y + s - 2], outline=col, width=1)
        d.ellipse([x + 5, y + 5, x + s - 5, y + s - 5], fill=col)


def draw_window(img, nav_active=0, browser=True):
    d = ImageDraw.Draw(img)
    paste_shadow(img, WIN, r=16, blur=22, alpha=30)
    rr(d, WIN, 16, fill=WHITE, outline=(226, 231, 236))
    x0, y0, x1, y1 = WIN
    if browser:
        rr(d, (x0, y0, x1, y0 + TITLE_H), 16, fill=(248, 249, 251))
        d.rectangle([x0, y0 + TITLE_H - 12, x1, y0 + TITLE_H], fill=(248, 249, 251))
        for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
            d.ellipse([x0 + 14 + i * 15, y0 + 12, x0 + 22 + i * 15, y0 + 20], fill=c)
        rr(d, (x0 + 70, y0 + 8, x0 + 470, y0 + 26), 9, fill=WHITE, outline=LINE)
        txt(d, (x0 + 82, y0 + 17), 'dream-sandwich-business-manager.html', f(11), MUT, 'lm')
        d.line([(x0, y0 + TITLE_H), (x1, y0 + TITLE_H)], fill=LINE)
    # sidebar
    sy0 = y0 + (TITLE_H if browser else 0)
    d.rectangle([x0 + 1, sy0, x0 + SIDE_W, y1 - 1], fill=WHITE)
    d.line([(x0 + SIDE_W, sy0), (x0 + SIDE_W, y1 - 1)], fill=LINE2)
    # brand
    rr(d, (x0 + 14, sy0 + 14, x0 + 48, sy0 + 48), 9, fill=INK)
    txt(d, (x0 + 31, sy0 + 31), 'DS', f(12, True), WHITE, 'mm')
    txt(d, (x0 + 56, sy0 + 23), 'Dream Sandwich', f(12, True), INK, 'lm')
    txt(d, (x0 + 56, sy0 + 38), 'BUSINESS MANAGER', f(7.5), MUT, 'lm')
    d.line([(x0 + 1, sy0 + 62), (x0 + SIDE_W, sy0 + 62)], fill=LINE2)
    # nav
    ny = sy0 + 74
    for i, (label, ic) in enumerate(NAV_DEF):
        act = (i == nav_active)
        if act:
            rr(d, (x0 + 8, ny - 3, x0 + SIDE_W - 8, ny + 26), 8, fill=SOFT)
            d.rectangle([x0 + 8, ny + 2, x0 + 10, ny + 21], fill=INK)
        icon_glyph(d, ic, x0 + 18, ny + 6, col=(INK if act else (170, 176, 185)))
        txt(d, (x0 + 38, ny + 11), label, f(11.5, act), (INK if act else INK2), 'lm')
        ny += 33
    # footer
    d.line([(x0 + 1, y1 - 52), (x0 + SIDE_W, y1 - 52)], fill=LINE2)
    txt(d, (x0 + 16, y1 - 38), 'FY 2026-27', f(9.5), MUT, 'lm')
    txt(d, (x0 + 16, y1 - 24), 'Data browser me auto-save', f(9.5), MUT, 'lm')
    return x0 + SIDE_W + 1, sy0, x1 - 1, y1 - 1


def content_box():
    x0, y0, x1, y1 = WIN
    return x0 + SIDE_W + 1, y0 + TITLE_H, x1 - 1, y1 - 1


def page_head(d, box, title, sub, buttons=(), badge=None):
    x0, y0, x1, y1 = box
    px = x0 + 20
    txt(d, (px, y0 + 26), title, f(17, True), INK, 'lm')
    txt(d, (px, y0 + 47), sub, f(10.5), MUT, 'lm')
    bx = x1 - 20
    for i, b in enumerate(reversed(buttons)):
        primary = (i == 0 and b.startswith('+'))
        w = tw(b, f(10.5, True)) + 24
        rr(d, (bx - w, y0 + 16, bx, y0 + 40), 8, fill=(INK if primary else WHITE),
           outline=(None if primary else LINE))
        txt(d, (bx - w / 2, y0 + 28), b, f(10.5, primary), (WHITE if primary else INK2), 'mm')
        bx -= (w + 8)
    if badge:
        txt(d, (px + tw(title, f(17, True)) + 12, y0 + 26), badge, f(9, True), TEAL, 'lm')
    d.line([(px, y0 + 62), (x1 - 20, y0 + 62)], fill=LINE2)


def tiles(d, box, items, top=76, gap=10):
    x0, y0, x1, y1 = box
    px = x0 + 20
    n = len(items)
    tw_ = (x1 - 20 - px - gap * (n - 1)) / n
    for i, it in enumerate(items):
        label, val, foot = it[0], it[1], it[2] if len(it) > 2 else ''
        col = it[3] if len(it) > 3 else None
        bx = px + i * (tw_ + gap)
        rr(d, (bx, y0 + top, bx + tw_, y0 + top + 68), 10, fill=WHITE, outline=LINE)
        txt(d, (bx + 12, y0 + top + 16), label.upper(), f(7.5, True), MUT, 'lm')
        vc = {POS: POS, RED: RED, AMB: AMB, TEAL: TEAL, IND: IND}.get(col, INK)
        txt(d, (bx + 12, y0 + top + 38), val, f(16, True), vc, 'lm')
        if foot:
            txt(d, (bx + 12, y0 + top + 56), foot, f(8.5), MUT, 'lm')


def card(d, box, x, y, w, h, title, sub, badge=None, head_right=None):
    rr(d, (x, y, x + w, y + h), 10, fill=WHITE, outline=LINE)
    txt(d, (x + 14, y + 17), title, f(11, True), INK, 'lm')
    if sub:
        txt(d, (x + 14, y + 31), sub, f(8.5), MUT, 'lm')
    if badge:
        bw = tw(badge, f(8, True)) + 14
        rr(d, (x + w - 14 - bw, y + 10, x + w - 14, y + 24), 7, fill=SOFT)
        txt(d, (x + w - 14 - bw / 2, y + 17), badge, f(8, True), INK2, 'mm')
    if head_right:
        bw = tw(head_right, f(9, True)) + 16
        rr(d, (x + w - 14 - bw, y + 9, x + w - 14, y + 26), 7, fill=WHITE, outline=LINE)
        txt(d, (x + w - 14 - bw / 2, y + 17.5), head_right, f(9), INK2, 'mm')
    d.line([(x, y + 40), (x + w, y + 40)], fill=LINE2)
    return y + 40


def table(d, x, y, w, cols, rows, rowh=26, head=True, highlight_rows=(), small=False, fill=None):
    """cols: [(label, width_fraction, align)]"""
    fs = f(9.2 if small else 9.6)
    fsb = f(9.2 if small else 9.6, True)
    if head:
        cx = x
        for label, frac, al in cols:
            ww = w * frac
            if al == 'r':
                txt(d, (cx + ww - 8, y + 9), label.upper(), f(7.2, True), MUT, 'rm')
            else:
                txt(d, (cx + 8, y + 9), label.upper(), f(7.2, True), MUT, 'rm' if al == 'r' else 'lm')
            cx += ww
        d.line([(x, y + 18), (x + w, y + 18)], fill=LINE)
        y += 20
    for i, r in enumerate(rows):
        if i in highlight_rows:
            rr(d, (x, y, x + w, y + rowh), 5, fill=(247, 253, 250))
        cx = x
        for (label, frac, al), cell in zip(cols, r):
            ww = w * frac
            col = INK if al != 'r' else INK
            fo = fsb if (al == 'b') else fs
            if al == 'r':
                txt(d, (cx + ww - 8, y + rowh / 2), cell, fo, col, 'rm')
            else:
                txt(d, (cx + 8, y + rowh / 2), cell, fo, col, 'lm')
            cx += ww
        d.line([(x, y + rowh), (x + w, y + rowh)], fill=LINE2)
        y += rowh
    if fill:
        while y + rowh <= fill:
            cx = x
            for i, (label, frac, al) in enumerate(cols):
                ww = w * frac
                bw = ww * (0.28 + 0.34 * ((i * 7 + int(y)) % 5) / 4)
                if al == 'r':
                    d.rounded_rectangle([cx + ww - 8 - bw, y + rowh / 2 - 3, cx + ww - 8, y + rowh / 2 + 3], 3, fill=(238, 241, 245))
                else:
                    d.rounded_rectangle([cx + 8, y + rowh / 2 - 3, cx + 8 + bw, y + rowh / 2 + 3], 3, fill=(238, 241, 245))
                cx += ww
            d.line([(x, y + rowh), (x + w, y + rowh)], fill=(247, 248, 250))
            y += rowh
    return y


def badge_pill(d, x, y, text, fg=INK2, bg=SOFT, fs=8):
    w = tw(text, f(fs, True)) + 12
    rr(d, (x, y, x + w, y + 15), 5, fill=bg)
    txt(d, (x + w / 2, y + 7.5), text, f(fs, True), fg, 'mm')
    return w


def modal(d, img, box, spec, t, appear=0.12):
    """spec: {title, sub, w, h, body_fn(d, x, y, w, h, t), foot:[..], badge}"""
    p = ease(seg(t, appear, appear + 0.16))
    if p <= 0.01:
        return None
    x0, y0, x1, y1 = box
    # scrim inside window
    ov = Image.new('RGBA', (int(x1 - x0), int(y1 - y0)), (17, 24, 39, int(70 * p)))
    img.paste(Image.alpha_composite(img.crop((x0, y0, x1, y1)).convert('RGBA'), ov).convert('RGB'), (int(x0), int(y0)))
    mw, mh = spec.get('w', 470), spec.get('h', 320)
    mx = x0 + (x1 - x0 - mw) / 2
    my = y0 + (y1 - y0 - mh) / 2 - 8 * (1 - p)
    mbox = (mx, my, mx + mw, my + mh)
    paste_shadow(img, mbox, r=14, blur=18, alpha=50)
    d2 = ImageDraw.Draw(img)
    rr(d2, mbox, 13, fill=WHITE, outline=(220, 226, 232))
    txt(d2, (mx + 18, my + 22), spec['title'], f(13, True), INK, 'lm')
    if spec.get('sub'):
        txt(d2, (mx + 18, my + 40), spec['sub'], f(9.5), MUT, 'lm')
    if spec.get('badge'):
        bw = tw(spec['badge'], f(8, True)) + 14
        rr(d2, (mx + mw - 18 - bw - 26, my + 13, mx + mw - 44, my + 29), 6, fill=TEAL_BG)
        txt(d2, (mx + mw - 18 - bw / 2 - 26, my + 21), spec['badge'], f(8, True), TEAL, 'mm')
    # close x
    rr(d2, (mx + mw - 34, my + 12, mx + mw - 16, my + 30), 6, fill=SOFT)
    txt(d2, (mx + mw - 25, my + 21), 'x', f(9, True), INK2, 'mm')
    d2.line([(mx, my + 52), (mx + mw, my + 52)], fill=LINE2)
    if spec.get('body_fn'):
        spec['body_fn'](d2, mx + 18, my + 64, mw - 36, mh - 118, t)
    fy = my + mh - 44
    d2.line([(mx, fy), (mx + mw, fy)], fill=LINE2)
    bx = mx + mw - 16
    for i, b in enumerate(reversed(spec.get('foot', ['Cancel', 'Save karein']))):
        primary = (i == 0)
        w = tw(b, f(9.5, True)) + 22
        rr(d2, (bx - w, fy + 10, bx, fy + 32), 7, fill=(INK if primary else WHITE), outline=(None if primary else LINE))
        txt(d2, (bx - w / 2, fy + 21), b, f(9.5, primary), (WHITE if primary else INK2), 'mm')
        bx -= (w + 8)
    return mbox


def highlight(d, img, box, rect, p=1.0, label=None, pulse=0.0, below=False):
    if p <= 0.01:
        return
    x, y, w, h = rect
    pad = 3 + 1.2 * math.sin(pulse * math.pi * 2)
    for i, a in enumerate([80, 34, 0]):
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle(
            [x - pad - i * 3, y - pad - i * 3, x + w + pad + i * 3, y + h + pad + i * 3],
            radius=10 + i * 2, outline=(15, 118, 110, int(a * p)), width=2)
        img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'), (0, 0))
    if label:
        d2 = ImageDraw.Draw(img)
        ww = tw(label, f(8.5, True)) + 16
        lx, ly = x, y - 24
        if below or ly < 60:
            ly = y + h + 6
        rr(d2, (lx, ly, lx + ww, ly + 18), 6, fill=TEAL)
        txt(d2, (lx + ww / 2, ly + 9), label, f(8.5, True), WHITE, 'mm')


def cursor(d, img, x, y, click=0.0):
    d2 = ImageDraw.Draw(img)
    pts = [(x, y), (x + 2.6, y + 15), (x + 7, y + 10.5), (x + 11.5, y + 16), (x + 14.5, y + 13.5), (x + 10, y + 8), (x + 17, y + 6.5)]
    d2.polygon(pts, fill=WHITE, outline=None)
    d2.polygon([(x + .6, y + .8), (x + 2.6, y + 13.6), (x + 6.6, y + 9.8), (x + 10.8, y + 14.8),
                (x + 13, y + 12.8), (x + 8.8, y + 7.6), (x + 15.4, y + 6.2)], fill=(17, 24, 39))
    if click > 0.01:
        r = 6 + 20 * click
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).ellipse([x - r, y - r, x + r, y + r], outline=(15, 118, 110, int(190 * (1 - click))), width=3)
        img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'), (0, 0))


def toast(img, box, text, p, kind='ok', pos='br'):
    if p <= 0.01:
        return
    d = ImageDraw.Draw(img)
    if pos == 'bl':
        x1, y1 = box[0] + 24 + tw(text, f(10, True)) + 34, box[3] - 22
    else:
        x1, y1 = box[2] - 24, box[3] - 22
    w = tw(text, f(10, True)) + 34
    a = int(255 * min(1, p))
    col = {'ok': (11, 107, 69), 'err': (143, 31, 31), 'warn': (138, 90, 8), 'ink': INK}[kind]
    lay = Image.new('RGBA', (int(w) + 40, 60), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    ld.rounded_rectangle([10, 12, 10 + w, 46], radius=8, fill=col + (a,))
    lay.paste(lay, (0, 0), lay)
    dd = ImageDraw.Draw(lay)
    txt(dd, (10 + w / 2, 29), text, f(10, True), (255, 255, 255, a), 'mm')
    img.paste(lay, (int(x1 - w - 10), int(y1 - 46)), lay)


# ---------------------------------------------------------------- captions
def overlay(img, chapter, total, title, caption, prog, chapter_pill=None):
    d = ImageDraw.Draw(img)
    # bottom caption bar
    y = H - 58
    rr(d, (72, y, 1208, y + 38), 10, fill=(255, 255, 255), outline=(228, 232, 237))
    pill = chapter_pill or ('%02d / %02d' % (chapter, total))
    pw = tw(pill, f(9.5, True)) + 18
    rr(d, (84, y + 9, 84 + pw, y + 31), 6, fill=INK)
    txt(d, (84 + pw / 2, y + 20), pill, f(9.5, True), WHITE, 'mm')
    txt(d, (100 + pw, y + 20), title, f(11.5, True), INK, 'lm')
    tx = 100 + pw + tw(title, f(11.5, True)) + 16
    txt(d, (tx, y + 20), caption, f(10.5), INK2, 'lm')
    # progress
    d.rectangle([0, H - 6, W, H], fill=(226, 231, 236))
    d.rectangle([0, H - 6, int(W * prog), H], fill=(17, 24, 39))


def callout(img, ax, ay, text, dx=0, dy=0, tone='teal'):
    """small pill + leader line pointing at (ax, ay)"""
    d = ImageDraw.Draw(img)
    w = tw(text, f(8.5, True)) + 18
    x, y = ax + dx - w / 2, ay + dy
    fg, bgc = (TEAL, TEAL_BG) if tone == 'teal' else (AMB, AMB_BG)
    d.line([(ax, ay), (x + w / 2, y + (18 if dy > 0 else 0))], fill=(190, 216, 213), width=1)
    rr(d, (x, y, x + w, y + 18), 6, fill=WHITE, outline=(191, 231, 224))
    txt(d, (x + w / 2, y + 9), text, f(8.5, True), fg, 'mm')
