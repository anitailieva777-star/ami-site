"""Подготвя снимките от ../images за сайта: WebP в няколко размера в ../po-blizo/img.
Сцени 1–4 получават една и съща лека топла цветова корекция, за да изглеждат като серия.
Пускане: cd po-blizo-src && python3 images.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

HERE = Path(__file__).resolve().parent
SRC, OUT = HERE.parent / "images", HERE.parent / "po-blizo" / "img"
OUT.mkdir(parents=True, exist_ok=True)
WIDTHS = (480, 800, 1122)


def warm(im):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255
    grey = (a @ np.array([.299, .587, .114], np.float32))[..., None]
    a = grey + (a - grey) * .94                      # малко по-спокойни цветове
    a *= np.array([1.03, 1.0, .93], np.float32)      # топъл тон
    a = a * .95 + .035                               # меко повдигнати сенки (матов вид)
    return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))


def to_45(im):
    """Изрязва до 4:5 по ширина, като пази центъра на хората."""
    w, h = im.size
    tw = round(h * 4 / 5)
    if tw >= w:
        return im
    left = round((w - tw) * .4)
    return im.crop((left, 0, left + tw, h))


def export(im, name):
    w0 = im.size[0]
    for w in WIDTHS:
        w = min(w, w0)
        im.resize((w, round(im.size[1] * w / w0)), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", quality=80, method=6)


export(Image.open(SRC / "box-hero.png").convert("RGB"), "box-hero")
for n, stem in enumerate(["scene-1-sofa", "scene-2-kitchen", "scene-3-dinner", "scene-4-window"], 1):
    export(warm(to_45(Image.open(SRC / f"{stem}.png"))), stem)
export(to_45(Image.open(SRC / "scene-5-evening.png").convert("RGB")), "scene-5-evening")
print("ok")
