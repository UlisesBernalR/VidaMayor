"""Genera los íconos y la pantalla de inicio (assets/*.png) de VidaMayor.
Uso: python3 scripts/make-icons.py   (requiere Pillow)
Después, `capacitor-assets generate --android` los convierte en los recursos de Android."""
import math, os
from PIL import Image, ImageDraw

TEAL = (46, 125, 116)
DEEP = (31, 79, 74)
CREAM = (251, 246, 238)
WHITE = (255, 255, 255)
OUT = os.path.join(os.path.dirname(__file__), "..", "assets")
os.makedirs(OUT, exist_ok=True)
SS = 2  # supersampling


def heart(draw, cx, cy, width, fill, plus=None):
    pts = []
    for i in range(600):
        t = 2 * math.pi * i / 600
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x, -y))
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    s = width / (max(xs) - min(xs))
    mx = (max(xs) + min(xs)) / 2; my = (max(ys) + min(ys)) / 2
    poly = [(cx + (x - mx) * s, cy + (y - my) * s) for x, y in pts]
    draw.polygon(poly, fill=fill)
    if plus:
        # cruz centrada en la parte ancha del corazón
        pcx, pcy = cx, cy + width * 0.01
        arm, th = width * 0.17, width * 0.05
        r = th * 0.6
        draw.rounded_rectangle((pcx - th, pcy - arm, pcx + th, pcy + arm), radius=r, fill=plus)
        draw.rounded_rectangle((pcx - arm, pcy - th, pcx + arm, pcy + th), radius=r, fill=plus)


def canvas(size, bg=None):
    return Image.new("RGBA", (size * SS, size * SS), bg or (0, 0, 0, 0))


def done(img, size, name):
    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(OUT, name))
    print("ok", name, img.size)


# Ícono completo (versión antigua del launcher)
S = 1024
im = canvas(S, TEAL + (255,)); d = ImageDraw.Draw(im)
heart(d, S * SS / 2, S * SS / 2, S * SS * 0.56, WHITE, plus=TEAL)
done(im, S, "icon-only.png")

# Capa frontal del ícono adaptable (zona segura ~66 %)
im = canvas(S); d = ImageDraw.Draw(im)
heart(d, S * SS / 2, S * SS / 2, S * SS * 0.44, WHITE, plus=TEAL)
done(im, S, "icon-foreground.png")

# Capa de fondo
done(canvas(S, TEAL + (255,)), S, "icon-background.png")

# Pantallas de inicio
def splash(bg, name):
    N = 2732
    im = canvas(N, bg + (255,)); d = ImageDraw.Draw(im)
    box = 620 * SS
    x0 = N * SS / 2 - box / 2; y0 = N * SS / 2 - box / 2
    d.rounded_rectangle((x0, y0, x0 + box, y0 + box), radius=box * 0.28, fill=TEAL + (255,) if bg != DEEP else (46, 125, 116, 255))
    heart(d, N * SS / 2, N * SS / 2, box * 0.56, WHITE, plus=TEAL)
    done(im, N, name)

splash(CREAM, "splash.png")
splash(DEEP, "splash-dark.png")
