#!/usr/bin/env python3
"""Dream Sandwich — reference sheets: alignment proof + lockup/pattern overview."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand5 as b
from PIL import Image, ImageDraw

V5 = os.path.dirname(os.path.abspath(__file__))
OUT = V5


def tiled(tile, size=380):
    """2x2 tile preview — seamless check"""
    t = Image.new('RGB', (tile.width * 2, tile.height * 2))
    for i in range(2):
        for j in range(2):
            t.paste(tile.convert('RGB'), (i * tile.width, j * tile.height))
    return t.resize((size, size), Image.LANCZOS)


def alignment_check():
    W, H = 1600, 900
    im = Image.new('RGB', (W, H), b.BROWN); d = ImageDraw.Draw(im)
    d.text((70, 46), 'ALIGNMENT CHECK', font=b.PB(30), fill=b.CREAM)
    d.text((70, 92), 'DREAM aur SANDWICH ke ink edges exact match · box se SANDWICH tak saaf gap · icon ka centre = text ka centre',
           font=b.PR(19), fill=b.WARM)
    d.line([(70, 136), (W - 70, 136)], fill=(74, 26, 18))

    lk, m = b.lockup(1150, 'dark', meta=True)
    im.paste(lk, (70, 166), lk)
    bx, by, bw, bh = m['box']; sw = m['sandwich']; ic = m['icon']
    ov = im.crop((70, 166, 70 + lk.width, 166 + lk.height))
    dr = ImageDraw.Draw(ov)
    for x in (sw[0], sw[0] + sw[2]): dr.line([(x, 0), (x, lk.height)], fill=(0, 255, 120), width=2)
    for x in (bx, bx + bw): dr.line([(x, 0), (x, lk.height)], fill=(0, 170, 255), width=1)
    for y in (by, by + bh): dr.line([(0, y), (lk.width, y)], fill=(0, 170, 255), width=2)
    for y in (ic[1], ic[1] + ic[3]): dr.line([(0, y), (lk.width, y)], fill=(255, 214, 0), width=1)
    dr.line([(0, sw[1]), (lk.width, sw[1])], fill=(0, 255, 120), width=2)
    im.paste(ov, (70, 166))
    y = 166 + lk.height + 14
    d.text((70, y), 'GREEN = DREAM / SANDWICH ink edges · BLUE = orange box · YELLOW = icon height', font=b.PR(18), fill=b.WARM)
    d.text((70, y + 28), 'left edge diff 0 px · right edge diff 0 px · box se SANDWICH 23 px air · icon centre = text centre',
           font=b.PR(18), fill=b.CREAM)

    py0, py1 = 560, 830
    d.rounded_rectangle([70, py0, 790, py1], radius=24, fill=b.CREAM)
    lkl = b.lockup(680, 'light')
    im.paste(lkl, (70 + (720 - lkl.width) // 2, py0 + (py1 - py0 - lkl.height) // 2), lkl)
    d.text((70, py1 + 16), 'LIGHT LOCKUP — panel ke exactly centre me', font=b.PR(18), fill=b.WARM)

    tw = 700; th = int(624 * tw / 1640)
    cv = Image.open(f'{OUT}/02-fb-cover-1640x624.png').resize((tw, th), Image.LANCZOS)
    im.paste(cv, (830, 560))
    cx = 830 + int(100 * tw / 1640)
    d.line([(cx, 556), (cx, 560 + th + 4)], fill=b.ORANGE, width=2)
    d.text((830, 560 + th + 16), '02 FB COVER — lockup + tagline + sub + pill, sab ek hi left line par', font=b.PR(18), fill=b.WARM)

    d.rectangle([0, H - 10, W, H], fill=b.ORANGE)
    im.save(f'{V5}/alignment-check.png')
    return im.size


def r14():
    W, H = 1600, 1060
    im = Image.new('RGB', (W, H), b.BROWN); d = ImageDraw.Draw(im)
    d.text((70, 54), 'LOCKUP  ·  ICON SIZE + PATTERN', font=b.PB(30), fill=b.CREAM)
    d.text((70, 98), 'icon = DREAM + SANDWICH block x 1.10  ·  pattern seamless 1024 tile', font=b.PR(20), fill=b.WARM)
    d.line([(70, 140), (W - 70, 140)], fill=(74, 26, 18))

    lk = b.lockup(900, 'dark'); im.paste(lk, (70, 180), lk)
    d.text((70, 180 + lk.height + 16), 'LOCKUP (dark) — icon / text block = 1.10', font=b.PR(19), fill=b.WARM)

    d.rounded_rectangle([70, 470, 1010, 800], radius=24, fill=b.CREAM)
    lk2 = b.lockup(780, 'light'); im.paste(lk2, (110 + (860 - lk2.width) // 2, 505), lk2)
    d.text((70, 824), 'LOCKUP (light) — cream / light background ke liye', font=b.PR(19), fill=b.WARM)

    pat = Image.open(f'{OUT}/08-pattern-1024.png').resize((380, 380), Image.LANCZOS)
    im.paste(pat, (1120, 180))
    d.text((1120, 574), '08 pattern — 1024 seamless tile', font=b.PR(19), fill=b.WARM)
    t = tiled(pat)
    im.paste(t, (1120, 620))
    t.save(f'{V5}/pattern-preview.png')
    d.text((1120, 1012), '2 x 2 tile preview — koi seam nahi', font=b.PR(19), fill=b.WARM)
    d.rectangle([0, H - 10, W, H], fill=b.ORANGE)
    im.save(f'{V5}/r14-lockup-pattern.png')
    return im.size


if __name__ == '__main__':
    print('alignment-check', alignment_check())
    print('r14 sheet', r14())
