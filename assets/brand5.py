#!/usr/bin/env python3
"""Dream Sandwich — brand v5: original icon (image-3) + Fredoka wordmark + dark brown."""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, os
HERE=os.path.dirname(os.path.abspath(__file__))
V5=HERE; FT=os.path.join(HERE,'fonts')
ORANGE=(251,81,5); BROWN=(29,2,0); CARD=(43,10,5); LINE=(74,26,18)
CREAM=(255,247,239); WARM=(201,175,166); WHITE=(255,255,255)

def _recolor(im):
    a=np.asarray(im).astype(np.int16)
    w=(a[:,:,0]>235)&(a[:,:,1]>235)&(a[:,:,2]>235)&(a[:,:,3]>60)
    a[w,0],a[w,1],a[w,2]=BROWN
    return Image.fromarray(a.astype(np.uint8),'RGBA')

def icon(size, variant='dark'):
    im=Image.open(f'{V5}/icon-transparent.png').convert('RGBA')
    if variant=='light': im=_recolor(im)
    return im.resize((size,size), Image.LANCZOS)

def icon_ink(h, variant='dark'):
    """icon ko uske asli ink box par crop karke height `h` px — koi transparent padding nahi."""
    im=Image.open(f'{V5}/icon-transparent.png').convert('RGBA')
    if variant=='light': im=_recolor(im)
    im=im.crop(im.split()[3].getbbox())
    r=h/im.height
    return im.resize((max(1,int(round(im.width*r))), h), Image.LANCZOS)

def FB(s):
    f=ImageFont.truetype(f'{FT}/fredoka.ttf', s)
    try: f.set_variation_by_name('Bold')
    except Exception: pass
    return f
def PR(s): return ImageFont.truetype(f'{FT}/Poppins-Regular.ttf', s)
def PM(s): return ImageFont.truetype(f'{FT}/Poppins-Medium.ttf', s)
def PB(s): return ImageFont.truetype(f'{FT}/Poppins-Bold.ttf', s)

def track(d, xy, s, f, fill, sp, center=None):
    x,y=xy; total=sum(d.textlength(c,font=f)+sp for c in s)-sp if s else 0
    if center is not None: x=x-total/2
    for c in s:
        d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+sp
    return total

def _w(d, s, f, sp):
    return sum(d.textlength(c, font=f) for c in s) + sp * (len(s) - 1)

ICON_K = 1.10            # icon ki ink height = (DREAM + SANDWICH block) se halka sa bada
PAD    = 30              # orange box ka andar ka padding
BOX_H  = 104             # orange box ki height
GAP_DS = 14              # orange box ke bottom se SANDWICH ke ink top tak ka gap

def _ink(s, f, sp, X0=40, Y0=40):
    """string ko letter-spacing ke saath render karke exact ink box deta hai: (l, t, w, h) — draw origin se."""
    tmp = Image.new('L', (3000, 500), 0); td = ImageDraw.Draw(tmp)
    track(td, (X0, Y0), s, f, 255, sp)
    bb = tmp.getbbox()
    return bb[0] - X0, bb[1] - Y0, bb[2] - bb[0], bb[3] - bb[1]

def lockup(width, bg='dark', k=None, meta=False):
    """icon + DREAM (white on orange box) + SANDWICH — ink-perfect: dono words ke left/right edge barabar."""
    k = ICON_K if k is None else k
    f = FB(96); base_sp = 3
    l_s, t_s, w_s, h_s = _ink('SANDWICH', f, base_sp)
    for _ in range(2):                                   # DREAM ki ink width = SANDWICH ki ink width
        _, _, w_d0, _ = _ink('DREAM', f, 0)
        sp_d = (w_s - _ink('DREAM', f, 0)[2]) / (len('DREAM') - 1)
    l_d, t_d, w_d, h_d = _ink('DREAM', f, sp_d)
    dx = l_s - l_d                                       # DREAM ke letters ko SANDWICH ki left ink line par laao
    pad, box_h, gap = PAD, BOX_H, GAP_DS
    textw = int(round(w_s)) + pad * 2
    block_h = box_h + gap + h_s                          # box top se SANDWICH ki ink bottom tak
    ic_h = int(round(block_h * k))
    i = icon_ink(ic_h, 'dark' if bg == 'dark' else 'light')
    gap2 = int(round(block_h * 0.40))
    W = i.width + gap2 + textw; H = int(round(max(ic_h, block_h)))
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    im.paste(i, (0, int(round((H - ic_h) / 2))), i)
    x0 = i.width + gap2; y0 = int(round((H - block_h) / 2))
    d.rounded_rectangle([x0, y0, x0 + textw, y0 + box_h], radius=14, fill=ORANGE)
    x_t = x0 + pad
    y_d = y0 + (box_h - h_d) / 2 - t_d
    y_s = y0 + box_h + gap - t_s                         # box ke neeche se gap, DREAM se nahi
    track(d, (x_t + dx, y_d), 'DREAM', f, (255, 255, 255), sp_d)
    track(d, (x_t, y_s), 'SANDWICH', f, CREAM if bg == 'dark' else BROWN, base_sp)
    bb = im.getbbox(); im = im.crop(bb)
    out = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    if meta:
        sc = width / (bb[2] - bb[0]); ox, oy = bb[0], bb[1]
        g = lambda x, y, w, h: (round((x - ox) * sc), round((y - oy) * sc), round(w * sc), round(h * sc))
        return out, {'box': g(x0, y0, textw, box_h),
                     'dream': g(x_t + dx + l_d, y_d + t_d, w_d, h_d),
                     'sandwich': g(x_t + l_s, y_s + t_s, w_s, h_s),
                     'icon': g(0, (H - ic_h) / 2, i.width, ic_h)}
    return out

if __name__=='__main__':
    icon(1024,'dark').save(f'{V5}/icon-dark-1024.png')
    icon(1024,'light').save(f'{V5}/icon-light-1024.png')
    lockup(1400,'dark').save(f'{V5}/lockup-dark.png')
    lockup(1400,'light').save(f'{V5}/lockup-light.png')
    print('brand5 assets ok')
