import math, base64
Y = "#FFCC29"; N = "#0C3163"; W = "#FFFFFF"
logo = base64.b64encode(open("/home/claude/insta/brand/logo_dark.png", "rb").read()).decode()

def gear(cx, cy, r, teeth, depth=0.18, rot=0, fill="none", stroke=Y, sw=4, hole=0.35):
    pts = []
    n = teeth * 4
    for i in range(n):
        a = rot + 2 * math.pi * i / n
        rr = r if (i % 4) in (0, 1) else r * (1 - depth)
        pts.append(f"{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}")
    s = f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
    if hole:
        s += f'<circle cx="{cx}" cy="{cy}" r="{r*hole}" fill="{N}" stroke="{stroke}" stroke-width="{sw}"/>'
    return s

def drop(cx, cy, s, ang=0, fill=Y, glow=False):
    # teardrop pointing up (tip at top), scaled by s, rotated ang degrees around its centre
    d = f"M0,{-1.6*s} C{0.55*s},{-0.7*s} {s},{-0.1*s} {s},{0.35*s} A{s},{s} 0 1 1 {-s},{0.35*s} C{-s},{-0.1*s} {-0.55*s},{-0.7*s} 0,{-1.6*s} Z"
    g = f' filter="url(#glow)"' if glow else ""
    return f'<path d="{d}" fill="{fill}" transform="translate({cx},{cy}) rotate({ang})"{g}/>'

def bearing(cx, cy, r, balls=10, col=Y):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{col}" stroke-width="{r*0.16:.1f}"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r*0.52}" fill="none" stroke="{col}" stroke-width="{r*0.12:.1f}"/>'
    for i in range(balls):
        a = 2 * math.pi * i / balls
        s += f'<circle cx="{cx + r*0.76*math.cos(a):.1f}" cy="{cy + r*0.76*math.sin(a):.1f}" r="{r*0.13:.1f}" fill="{W}"/>'
    return s

def hexbolt(cx, cy, r, rot=0, col=W):
    pts = " ".join(f"{cx + r*math.cos(rot+math.pi/3*i):.1f},{cy + r*math.sin(rot+math.pi/3*i):.1f}" for i in range(6))
    return f'<polygon points="{pts}" fill="none" stroke="{col}" stroke-width="3"/><circle cx="{cx}" cy="{cy}" r="{r*0.4}" fill="none" stroke="{col}" stroke-width="3"/>'

DEFS = f'''<defs>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#1a4a8f"/><stop offset="0.55" stop-color="{N}"/><stop offset="1" stop-color="#061a38"/></radialGradient>
<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{Y}" stop-opacity=".45"/><stop offset="1" stop-color="{Y}" stop-opacity="0"/></radialGradient>
<linearGradient id="oil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".45" stop-color="{Y}"/><stop offset="1" stop-color="#C98A00"/></linearGradient>
</defs>'''

def frame(art, tag, h1a, h1b, sub, fs=74):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">{DEFS}
<rect width="1080" height="1350" fill="url(#bg)"/>
<image href="data:image/png;base64,{logo}" x="52" y="44" width="290" height="{290*580/1384:.0f}"/>
<text x="1028" y="78" text-anchor="end" font-family="Poppins" font-weight="700" font-size="26" fill="{Y}" letter-spacing="3">{tag}</text>
{art}
<text x="540" y="1078" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="{fs}" fill="{W}">{h1a} <tspan fill="{Y}">{h1b}</tspan></text>
<text x="540" y="1140" text-anchor="middle" font-family="Poppins" font-weight="400" font-size="32" fill="#dfe7f5">{sub}</text>
<rect x="0" y="1230" width="1080" height="120" fill="{Y}"/>
<text x="540" y="1282" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="34" fill="{N}">www.lukeronlubricants.com</text>
<text x="540" y="1324" text-anchor="middle" font-family="Poppins" font-weight="500" font-size="24" fill="{N}">Oils · Greases · Coolants  ·  WhatsApp +91 98986 84484  ·  Jamnagar</text>
</svg>'''

# ---------- 1. Dev Uthani Ekadashi: mechanical rangoli with oil-drop diya ----------
cx, cy = 540, 600
a = f'<circle cx="{cx}" cy="{cy}" r="430" fill="url(#halo)"/>'
for i in range(24):
    t = 2*math.pi*i/24
    a += gear(cx + 395*math.cos(t), cy + 395*math.sin(t), 30, 8, rot=t, stroke=Y, sw=3, hole=0.3)
for i in range(16):
    t = 2*math.pi*i/16
    a += drop(cx + 320*math.cos(t), cy + 320*math.sin(t), 22, ang=math.degrees(t)+90, fill=Y)
for i in range(16):
    t = 2*math.pi*(i+0.5)/16
    a += hexbolt(cx + 318*math.cos(t), cy + 318*math.sin(t), 16, rot=t)
a += f'<circle cx="{cx}" cy="{cy}" r="262" fill="none" stroke="{W}" stroke-width="2" stroke-dasharray="4 10"/>'
for i in range(12):
    t = 2*math.pi*i/12
    a += f'<ellipse cx="{cx + 200*math.cos(t):.1f}" cy="{cy + 200*math.sin(t):.1f}" rx="58" ry="22" fill="none" stroke="{Y}" stroke-width="4" transform="rotate({math.degrees(t):.1f} {cx + 200*math.cos(t):.1f} {cy + 200*math.sin(t):.1f})"/>'
a += gear(cx, cy, 150, 18, depth=0.14, fill=N, stroke=Y, sw=6, hole=0)
a += f'<circle cx="{cx}" cy="{cy}" r="112" fill="{N}" stroke="{W}" stroke-width="3"/>'
# diya
a += f'<path d="M{cx-78},{cy+18} Q{cx},{cy+105} {cx+78},{cy+18} Q{cx+96},{cy+8} {cx+102},{cy-4} L{cx-102},{cy-4} Q{cx-96},{cy+8} {cx-78},{cy+18} Z" fill="{Y}"/>'
a += f'<ellipse cx="{cx}" cy="{cy-4}" rx="102" ry="14" fill="#C98A00"/>'
a += f'<circle cx="{cx}" cy="{cy-55}" r="70" fill="url(#halo)"/>'
a += drop(cx, cy-48, 26, fill="url(#oil)", glow=True)
a = f'<g transform="translate(540 640) scale(0.84) translate(-540 -600)">' + a + '</g>'
f1 = frame(a, "DEV UTHANI EKADASHI", "Dev jaage.", "Machine bhi.", "Diye ki lau ho ya machine ki raftaar: every drop, engineered.")

# ---------- 2. Tulsi Vivah: perfect jodi gears with garland ----------
cxl, cxr, cyg = 400, 680, 600
r1, r2 = 175, 140
b = f'<circle cx="540" cy="600" r="440" fill="url(#halo)"/>'
b += gear(cxl, cyg, r1, 20, depth=0.15, fill="none", stroke=Y, sw=8, hole=0.28)
b += gear(cxr+12, cyg, r2, 16, depth=0.17, rot=0.1, fill="none", stroke=W, sw=8, hole=0.3)
# garland (varmala) loop around both gears
for i in range(46):
    t = 2*math.pi*i/46
    gx = 540 + 390*math.cos(t); gy = 610 + 255*math.sin(t)
    col = "#FF9F1C" if i % 2 else Y
    b += f'<circle cx="{gx:.1f}" cy="{gy:.1f}" r="17" fill="{col}"/><circle cx="{gx:.1f}" cy="{gy:.1f}" r="6" fill="#C96A00"/>'
for k in range(5):
    b += f'<path d="M{540-30+15*k},{868} q-6,22 0,44" stroke="{Y}" stroke-width="5" fill="none"/>'
# tulsi leaves on top
for dx, ang in [(-40, -35), (0, 0), (40, 35)]:
    b += f'<ellipse cx="{540+dx}" cy="{318}" rx="22" ry="46" fill="#3DBB6B" transform="rotate({ang} {540+dx} 340)"/>'
b += drop(552, 600, 24, fill="url(#oil)", glow=True)
f2 = frame(b, "TULSI VIVAH", "Perfect jodi,", "bina ghisaav ke.", "Har rishta aur har machine, sahi lubrication se smooth chalti hai.", fs=64)

# ---------- 3. Dev Diwali + Gurpurab: ghat of bearing-diyas on river ----------
c = '<rect x="0" y="720" width="1080" height="380" fill="#061a38"/>'
for i, (yy, ww) in enumerate([(520, 1080), (580, 1000), (640, 920), (700, 840)]):
    c += f'<rect x="{540-ww/2}" y="{yy}" width="{ww}" height="62" fill="{"#123d78" if i%2 else "#0f3366"}"/>'
for row, (yy, n, rr) in enumerate([(505, 9, 26), (565, 8, 28), (625, 7, 30), (685, 6, 32)]):
    for i in range(n):
        x = 540 + (i - (n-1)/2) * (110 + row*6)
        c += bearing(x, yy+30, rr)
        c += f'<circle cx="{x}" cy="{yy-14}" r="26" fill="url(#halo)"/>' + drop(x, yy-6, 11, fill="url(#oil)", glow=True)
# river reflections
for i in range(40):
    x = 60 + (i*97) % 960; yy = 790 + (i*53) % 230; w = 30 + (i*17) % 70
    c += f'<rect x="{x}" y="{yy}" width="{w}" height="4" rx="2" fill="{Y}" opacity="{0.15 + (i%5)*0.08:.2f}"/>'
# moon (Purnima) as a big bearing
c += f'<circle cx="540" cy="300" r="150" fill="url(#halo)"/>' + bearing(540, 300, 92, balls=14, col=Y)
c += f'<circle cx="540" cy="300" r="40" fill="#FFF3B0"/>'
f3 = frame(c, "DEV DIWALI · GURPURAB", "Hazaar diye,", "ek hi roshni.", "Dev Diwali aur Guru Nanak Jayanti ki hardik shubhkamnayein.", fs=68)

for i, f in enumerate([f1, f2, f3], 1):
    html = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Poppins;src:url(../Poppins-Regular.ttf);font-weight:400}}
@font-face{{font-family:Poppins;src:url(../Poppins-Medium.ttf);font-weight:500}}
@font-face{{font-family:Poppins;src:url(../Poppins-Bold.ttf);font-weight:700}}
body{{margin:0}}</style></head><body>{f}</body></html>'''
    open(f"p{i}.html", "w").write(html)
