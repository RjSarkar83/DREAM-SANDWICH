#!/usr/bin/env python3
"""Dream Sandwich — social kit v3 (icon unchanged · Anurati wordmark · dark brown base)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, os

HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=HERE; V5=HERE; OUT=HERE; os.makedirs(OUT, exist_ok=True)
FT=os.path.join(HERE,'fonts'); ART=os.path.join(HERE,'art')
ORANGE=(251,81,5); BROWN=(29,2,0); CARD=(43,10,5); LINE=(74,26,18)
CREAM=(255,247,239); WARM=(201,175,166); WHITE=(255,255,255)

def A(s):
    f=ImageFont.truetype(f'{FT}/fredoka.ttf', s)
    try: f.set_variation_by_name('Bold')
    except Exception: pass
    return f
def P(w,s): return ImageFont.truetype(f'{FT}/Poppins-{w}.ttf', s)
def tw(d,s,f): return d.textlength(s,font=f)
def track(d,xy,s,f,fill,sp,center=None):
    x,y=xy; total=sum(tw(d,c,f)+sp for c in s)-sp if s else 0
    if center is not None: x=x-total/2
    for c in s:
        d.text((x,y),c,font=f,fill=fill); x+=tw(d,c,f)+sp
    return total
def twk(d,s,f,sp): return sum(tw(d,c,f)+sp for c in s)-sp if s else 0


def word_mark(lines, gap=8):
    """lines=[(text, font, fill, sp)] → ink par crop kiya hua stacked wordmark (left aligned)."""
    tmp=Image.new('L',(10,10)); td=ImageDraw.Draw(tmp)
    info=[]
    for t,f,c,sp in lines:
        bb=td.textbbox((0,0),t,font=f)
        info.append((bb, td.textlength(t,font=f)+sp*(len(t)-1)))
    W=int(max(w for _,w in info))+8
    H=int(sum(bb[3]-bb[1] for bb,_ in info)+gap*(len(lines)-1))+8
    im=Image.new('RGBA',(W,H),(0,0,0,0)); d2=ImageDraw.Draw(im); y=4
    for (t,f,c,sp),(bb,w) in zip(lines,info):
        track(d2,(4,y-bb[1]),t,f,c,sp); y+=bb[3]-bb[1]+gap
    return im.crop(im.split()[3].getbbox())

def icon(size, variant='dark'): return Image.open(f'{V5}/icon-{"dark" if variant=="dark" else "light"}-1024.png').resize((size,size), Image.LANCZOS)
def lockup(width, variant='dark'):
    lk=Image.open(f'{V5}/lockup-{"dark" if variant=="dark" else "light"}.png')
    return lk.resize((width,int(width*lk.height/lk.width)), Image.LANCZOS)

def photo(path, box):
    im=Image.open(path).convert('RGB'); W,H=box
    r=max(W/im.width, H/im.height)
    im=im.resize((int(im.width*r+1),int(im.height*r+1)), Image.LANCZOS)
    x=(im.width-W)//2; y=(im.height-H)//2
    return im.crop((x,y,x+W,y+H))

def fade(im, x0, x1, color=BROWN, side='left'):
    W,H=im.size; arr=np.zeros((H,W,4),np.uint8)
    for x in range(W):
        if side=='left':
            t=0.0 if x<=x0 else (1.0 if x>=x1 else (x-x0)/(x1-x0))
        else:
            t=0.0 if x>=x1 else (1.0 if x<=x0 else (x1-x)/(x1-x0))
        arr[:,x,:3]=color; arr[:,x,3]=int(255*(1-t)**1.3)
    return Image.alpha_composite(im.convert('RGBA'), Image.fromarray(arr,'RGBA'))

def glow(im, cx, cy, r, color=ORANGE, a=60, blur=50):
    W,H=im.size; gl=Image.new('RGBA',(W,H),(0,0,0,0)); gd=ImageDraw.Draw(gl)
    for i in range(20,0,-1):
        rr=int(r*i/20); gd.ellipse([cx-rr,cy-rr,cx+rr,cy+rr], fill=color+(int(a*(1-i/20)**2),))
    return Image.alpha_composite(im.convert('RGBA'), gl.filter(ImageFilter.GaussianBlur(blur)))

def pill(d, x, y, text, f, fg=WHITE, bg=ORANGE, padx=34, pady=18):
    w=tw(d,text,f)+padx*2; h=f.size+pady*2
    d.rounded_rectangle([x,y,x+w,y+h], radius=h//2, fill=bg)
    d.text((x+w/2,y+h/2), text, font=f, fill=fg, anchor='mm')
    return w,h

HANDLE='@dreamsandwichbetul'

# 01 ---------------------------------------------------------------- profile
def a01():
    S=1080; im=Image.new('RGB',(S,S),BROWN); d=ImageDraw.Draw(im)
    im=glow(im,S/2,S/2,560,a=54).convert('RGB'); d=ImageDraw.Draw(im)
    d.ellipse([40,40,S-40,S-40], outline=(255,255,255,), width=0)
    ic=icon(660); im.paste(ic,((S-660)//2,(S-660)//2),ic)
    im.save(f'{OUT}/01-profile-1080.png', optimize=True)

# 02 ---------------------------------------------------------------- fb cover
def a02():
    W,H=1640,624
    im=photo(f'{ART}/cover-flatlay.png',(W,H)).convert('RGBA')
    im=fade(im, int(W*0.30), int(W*0.72))
    im=glow(im, 120, 140, 460, a=40, blur=60)
    d=ImageDraw.Draw(im)
    lk=lockup(600); im.paste(lk,(100,132),lk)
    track(d,(100,330),'BAKERY  ·  STORE  ·  MARKETING SUPPLY', P('Medium',23), WARM, sp=2)
    d.text((100,372),'Taza bana. Taza becha. — Betul, M.P.', font=P('Regular',25), fill=(236,226,218))
    pill(d,100,432,'Subah 7 baje se khula',P('SemiBold',19),fg=BROWN,bg=CREAM)
    d.text((100,540),HANDLE, font=P('Medium',20), fill=(168,144,136))
    im.convert('RGB').save(f'{OUT}/02-fb-cover-1640x624.png', optimize=True)

# 03 ---------------------------------------------------------------- fb post
def a03():
    W,H=1200,630
    im=photo(f'{ART}/hero-sandwich.png',(760,H)).convert('RGBA')
    canvas=Image.new('RGBA',(W,H),BROWN+(255,)); canvas.paste(im,(W-760,0))
    canvas=fade(canvas, 300, 830)
    d=ImageDraw.Draw(canvas)
    ic=icon(76); ibb=ic.split()[3].getbbox(); iy=48
    cy=iy+(ibb[1]+ibb[3])/2
    canvas.paste(ic,(60,iy),ic)
    wm=word_mark([('DREAM',A(34),WHITE,0),('SANDWICH',A(22),ORANGE,2)])
    canvas.paste(wm,(60+ibb[2]+22,int(cy-wm.height/2)),wm)
    d.rounded_rectangle([60,158,180,164], radius=3, fill=ORANGE)
    d.text((60,186),'Aaj ka', font=P('SemiBold',34), fill=ORANGE)
    d.text((60,224),'fresh batch', font=P('ExtraBold',64), fill=CREAM)
    d.text((60,296),'taiyaar hai.', font=P('ExtraBold',64), fill=CREAM)
    y=396
    for t in ['Subah 7 baje se','Eggless · Fresh','Store + Supply']:
        w,h=pill(d,60,y,t,P('Medium',17),fg=(240,232,224),bg=CARD,padx=26,pady=12); y+=h+8
    d.text((60,574),'Order: DM ya WhatsApp   ·   '+HANDLE, font=P('Regular',17), fill=(168,144,136))
    canvas.convert('RGB').save(f'{OUT}/03-fb-post-1200x630.png', optimize=True)

# 04 ---------------------------------------------------------------- ig post
def a04():
    S=1080
    im=Image.new('RGBA',(S,S),CREAM+(255,))
    ph=photo(f'{ART}/hero-sandwich.png',(S,690)); im.paste(ph,(0,0))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle([-40,632,S+40,S+40], radius=60, fill=CREAM)
    lk=lockup(470,'light'); im.paste(lk,(56,700),lk)
    d.text((56,838),'Roz subah fresh.', font=P('Bold',44), fill=BROWN)
    d.text((56,890),'Sandwich, bakery aur store supply — ek hi dukaan.',
           font=P('Regular',22), fill=(96,72,64))
    w,h=pill(d,56,946,'WhatsApp par order',P('SemiBold',21),fg=WHITE,bg=ORANGE)
    d.text((S-56,946+h/2),HANDLE, font=P('Medium',17), fill=(140,112,102), anchor='rm')
    im.convert('RGB').save(f'{OUT}/04-ig-post-1080.png', optimize=True)

# 05 ---------------------------------------------------------------- story
def a05():
    W,H=1080,1920
    im=Image.new('RGBA',(W,H),BROWN+(255,)); im=glow(im,W/2,560,700,a=52,blur=70)
    d=ImageDraw.Draw(im)
    ic=icon(300); im.paste(ic,((W-300)//2-10,120),ic)
    track(d,(W/2,470),'D R E A M   S A N D W I C H', A(34), CREAM, 6, center=True)
    d.text((W/2,556),'Aaj ka', font=P('SemiBold',44), fill=ORANGE, anchor='ma')
    d.text((W/2,616),'fresh stock', font=P('ExtraBold',86), fill=CREAM, anchor='ma')
    d.text((W/2,726),'taiyaar hai', font=P('ExtraBold',86), fill=CREAM, anchor='ma')
    d.text((W/2,850),'Subah 7 baje se  ·  Eggless  ·  Store pickup', font=P('Regular',27), fill=WARM, anchor='ma')
    # line
    d.rounded_rectangle([W/2-60,900,W/2+60,906], radius=3, fill=ORANGE)
    w,h=pill(d,180,960,'WhatsApp par order karein',P('SemiBold',36))
    for i,t in enumerate(['BAKERY','SANDWICH','SUPPLY','STALL']):
        x=110+i*220
        d.rounded_rectangle([x,1120,x+196,1190], radius=24, outline=LINE, width=2)
        track(d,(x+98,1155-11),t,P('SemiBold',19),WARM,2,center=True)
    im.paste(lockup(560),(W//2-280,1330),lockup(560))
    d.text((W/2,1640),HANDLE, font=P('Medium',26), fill=(150,126,118), anchor='ma')
    im.convert('RGB').save(f'{OUT}/05-ig-story-1080x1920.png', optimize=True)

# 06 ---------------------------------------------------------------- reel cover
def a06():
    W,H=1080,1920
    im=photo(f'{ART}/hero-sandwich.png',(W,H)).convert('RGBA')
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
    for y in range(H):
        t=y/H; a=int(50+225*max(0,(t-0.26)/0.74)**1.35)
        od.line([(0,y),(W,y)], fill=BROWN+(a,))
    im=Image.alpha_composite(im,ov)
    d=ImageDraw.Draw(im)
    ic=icon(84); ibb=ic.split()[3].getbbox(); iy=64
    cy=iy+(ibb[1]+ibb[3])/2
    im.paste(ic,(52,iy),ic)
    wm=word_mark([('DREAM',A(28),WHITE,6),('SANDWICH',A(18),ORANGE,5)])
    im.paste(wm,(52+ibb[2]+20,int(cy-wm.height/2)),wm)
    d.text((52,1080),'FRESH', font=P('ExtraBold',132), fill=CREAM)
    d.text((52,1216),'DAILY', font=P('ExtraBold',132), fill=ORANGE)
    d.text((56,1372),'Sandwich · Bakery · Store supply', font=P('Regular',30), fill=(238,230,222))
    w,h=pill(d,56,1480,'Order on WhatsApp',P('SemiBold',32),fg=BROWN,bg=CREAM)
    d.text((56,1790),HANDLE, font=P('Medium',24), fill=(210,192,184))
    im.convert('RGB').save(f'{OUT}/06-reel-cover-1080x1920.png', optimize=True)

# 07 ---------------------------------------------------------------- highlight
def a07():
    S=1080; im=Image.new('RGB',(S,S),BROWN); d=ImageDraw.Draw(im)
    d.ellipse([70,70,S-70,S-70], outline=ORANGE, width=12)
    ic=icon(470); im.paste(ic,((S-470)//2,(S-470)//2-70),ic)
    d.text((S/2,S/2+230),'MENU', font=A(96), fill=CREAM, anchor='mm')
    track(d,(S/2,S/2+320),'D R E A M  S A N D W I C H', P('Medium',20), ORANGE, 3, center=True)
    im.save(f'{OUT}/07-highlight-menu-1080.png', optimize=True)

# 08 ---------------------------------------------------------------- pattern
def _ink(h, variant='dark'):
    """icon ko ink box par crop karke height h — pattern me gaps barabar rehte hain"""
    im = Image.open(f'{V5}/icon-{variant}-1024.png').convert('RGBA')
    im = im.crop(im.split()[3].getbbox())
    r = h / im.height
    return im.resize((max(1, int(round(im.width * r))), h), Image.LANCZOS)

def _put(bg, tile, x, y, S):
    """seamless tiling — jo bahar nikalta hai wo doosri side se wapas aata hai"""
    for dx in (-S, 0, S):
        for dy in (-S, 0, S):
            bg.paste(tile, (int(x) + dx, int(y) + dy), tile)

def a08():
    S = 1024; step = 256; ih = 124
    bg = Image.new('RGBA', (S, S), BROWN + (255,))
    gl = _ink(ih, 'dark')
    arr = np.asarray(gl).astype(np.float32); arr[:, :, 3] *= 0.30
    faint = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    dot = Image.new('RGBA', (11, 11), (0, 0, 0, 0))
    ImageDraw.Draw(dot).ellipse([0, 0, 10, 10], fill=ORANGE + (205,))
    n = S // step; iw = faint.width; ihalf = step // 2
    for row in range(n):
        cy = row * step + ihalf
        for col in range(n):
            cx = col * step + ihalf                          # icon cell ke centre par — kuch bhi cut nahi hota
            bg.paste(faint, (int(cx - iw // 2), int(cy - ih // 2)), faint)
        for col in range(n + 1):                             # orange dot dono icons ke beech (seam par bhi)
            dx = int(col * step - 5)
            for o in (-S, 0, S):
                bg.paste(dot, (dx + o, int(cy - 5)), dot)
    bg.convert('RGB').save(f'{OUT}/08-pattern-1024.png', optimize=True)

# 09 ---------------------------------------------------------------- menu card
def a09():
    W,H=1080,1350
    im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,280], fill=BROWN)
    lk=lockup(470); im.paste(lk,(60,60),lk)
    track(d,(60,202),'B A K E R Y   ·   S T O R E   ·   S U P P L Y', P('Medium',15), ORANGE, 2)
    d.text((60,234),'Menu  ·  sample', font=P('Regular',20), fill=WARM)
    y=330
    blocks=[('SANDWICH',[('Veg Sandwich','45'),('Grilled Cheese','59'),('Combo (sandwich + drink)','49')]),
            ('BAKERY',[('Fresh Bread (400g)','35'),('Butter Croissant','40'),('Cream Roll','25')]),
            ('SUPPLY / STORE',[('Maida (per kg)','42'),('Butter (per kg)','520'),('Tissue box','60')])]
    for title, items in blocks:
        track(d,(60,y),title, P('Bold',18), ORANGE, 3); y+=40
        for name,price in items:
            d.text((60,y), name, font=P('Medium',25), fill=(48,24,18))
            d.text((W-60,y), '₹'+price, font=P('SemiBold',25), fill=BROWN, anchor='ra')
            d.line([(60,y+44),(W-60,y+44)], fill=(226,214,200), width=2); y+=64
        y+=22
    d.rectangle([0,H-96,W,H], fill=ORANGE)
    d.text((60,H-48),'Rate apne hisaab se badal sakte hain   ·   '+HANDLE,
           font=P('Medium',18), fill=(255,255,255), anchor='lm')
    im.save(f'{OUT}/09-menu-card-1080x1350.png', optimize=True)

# 10 ---------------------------------------------------------------- brand sheet
def a10():
    W,H=1600,1100
    im=Image.new('RGB',(W,H),BROWN); d=ImageDraw.Draw(im)
    for x in range(0,W,50): d.line([(x,0),(x,H)], fill=(36,12,8))
    for y in range(0,H,50): d.line([(0,y),(W,y)], fill=(36,12,8))
    track(d,(70,50),'DREAM SANDWICH', A(46), CREAM, 3)
    track(d,(72,120),'B R A N D   S Y S   ·   v 5 . 0', P('Medium',15), ORANGE, 2)
    d.line([(70,160),(W-70,160)], fill=LINE)

    ic=icon(280); im.paste(ic,(70,206),ic)
    track(d,(70,506),'PRIMARY ICON', P('Bold',14), WARM, 2)
    d.text((70,534),'Aapka original mark — bilkul waisa hi:', font=P('Regular',17), fill=(226,214,206))
    d.text((70,560),'“D” + spoon + fork ka negative space,', font=P('Regular',17), fill=(226,214,206))
    d.text((70,586),'upar “S” ka curve, saath white arc.', font=P('Regular',17), fill=(226,214,206))
    d.text((70,614),'Naya: dark brown base + Fredoka wordmark.', font=P('Regular',17), fill=WARM)

    lk=lockup(560); im.paste(lk,(70,650),lk)
    track(d,(70,812),'LOCKUP  —  icon + DREAM (orange box) + SANDWICH', P('Medium',15), WARM, 2)
    x=70; tile=Image.open(f'{V5}/icon-tile.png')
    for px in (96,64,48,32,24,16):
        ii=tile.resize((px,px), Image.LANCZOS)
        im.paste(ii,(x,978-px),ii); x+=px+18
    d.text((70,998),'app icon / favicon — 16 se 96 px tak', font=P('Regular',15), fill=WARM)

    px_=820
    track(d,(px_,206),'PALETTE', P('Bold',14), WARM, 2)
    sw=[('ORANGE','#FB5105',ORANGE),('DARK BROWN','#1D0200',BROWN),('CARD','#2B0A05',CARD),
        ('CREAM','#FFF7EF',CREAM),('WARM GREY','#C9AFA6',WARM),('WHITE','#FFFFFF',WHITE)]
    for i,(n,h,c) in enumerate(sw):
        xx=px_+(i%3)*222; yy=236+(i//3)*118
        d.rounded_rectangle([xx,yy,xx+204,yy+94], radius=14, fill=c, outline=LINE, width=2)
        fg=BROWN if n in ('CREAM','WARM GREY','WHITE') else WHITE
        d.text((xx+14,yy+22), n, font=P('Bold',13), fill=fg)
        d.text((xx+14,yy+46), h, font=P('Medium',13), fill=fg)
    d.text((px_,470),'Black ki jagah #1D0200 — poore brand me.', font=P('Regular',15), fill=(226,214,206))

    track(d,(px_,512),'TYPE', P('Bold',14), WARM, 2)
    d.text((px_,536),'Aa', font=A(58), fill=CREAM)
    d.text((px_+150,548),'Fredoka Bold — DREAM SANDWICH wordmark', font=P('Regular',16), fill=(226,214,206))
    d.text((px_+150,576),'Poppins — body, menu, captions', font=P('Regular',16), fill=(226,214,206))
    d.text((px_+150,604),'Wordmark sirf Fredoka · message Poppins me', font=P('Regular',16), fill=WARM)

    track(d,(px_,652),'PATTERN', P('Bold',14), WARM, 2)
    pat=Image.open(f'{OUT}/08-pattern-1024.png').crop((200,40,1024,228)).resize((660,150), Image.LANCZOS)
    im.paste(pat,(px_,682))
    d.text((px_,842),'seamless 1024 tile — icon ka faint repeat, kisi bhi size par saaf', font=P('Regular',15), fill=WARM)

    track(d,(px_,888),'DO', P('Bold',14), (107,175,86), 2)
    d.text((px_+66,886),'icon ek hi · orange + brown + cream · saaf khali jagah', font=P('Regular',15), fill=(226,214,206))
    track(d,(px_,924),'DON’T', P('Bold',14), (226,74,42), 2)
    d.text((px_+86,922),'stretch · rotate · black ka use · 3 se zyada colour', font=P('Regular',15), fill=(226,214,206))

    d.rectangle([0,H-12,W,H], fill=ORANGE)
    d.text((520,H-50),'facebook.com/dreamsandwichbetul   ·   instagram.com/dreamsandwichbetul', font=P('Regular',15), fill=(170,144,134))
    im.save(f'{OUT}/10-brand-system.png', optimize=True)

for fn in (a01,a02,a03,a04,a05,a06,a07,a08,a09,a10):
    fn(); print('ok', fn.__name__)
