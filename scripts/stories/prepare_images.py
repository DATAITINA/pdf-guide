"""
Prepare story images for the website.

Full art lives in art-src/ (git-ignored, never deployed). This script copies ONLY what the
site may show into public/stories/<slug>/:

  cover.webp            800x1200 cover
  share.jpg             1200x630 link-preview image (X, WhatsApp)
  issue-<n>/page-NN.webp  free preview pages only (1067x1600)
  issue-<n>/teaser.webp   the first locked page, blurred INSIDE the file (cannot be un-blurred)

Usage (Python 3 + Pillow):
  python scripts/stories/prepare_images.py prepare --slug danfo-13 --issue 1 --free 3 \
      --title "Danfo 13" --hook "A ghost bus runs through Lagos at 3 a.m. ..."
  python scripts/stories/prepare_images.py cover --slug the-night-market --title "The Night Market" --hook "..."
  python scripts/stories/prepare_images.py placeholder ...   (same flags as prepare; fakes the art first)

Expected art-src layout:
  art-src/<slug>/cover.(png|jpg|jpeg|webp)
  art-src/<slug>/issue-<n>/page-01.(png|jpg|jpeg|webp), page-02..., one file per page
"""

import argparse
import os
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art-src"
PUBLIC = ROOT / "public" / "stories"

PAGE = (1067, 1600)
COVER = (800, 1200)
SHARE = (1200, 630)
TEASER = (360, 540)  # small on purpose: the blur leaves nothing worth zooming into

NIGHT = (11, 11, 12)
INK = (243, 238, 228)
YELLOW = (245, 197, 24)
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = (
        ["C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/System/Library/Fonts/Supplemental/Arial Bold.ttf"]
        if bold
        else ["C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
              "/System/Library/Fonts/Supplemental/Arial.ttf"]
    )
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def find_art(folder: Path, stem: str) -> Path | None:
    for ext in EXTS:
        p = folder / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def fit(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Crop to the target ratio from the centre, then resize."""
    return ImageOps.fit(img.convert("RGB"), size, Image.LANCZOS)


def wrap(draw: ImageDraw.ImageDraw, text: str, f, width: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if draw.textlength(trial, font=f) <= width:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


# ── Outputs ─────────────────────────────────────────────────────────────────

def write_cover(slug: str, title: str, hook: str) -> None:
    src = find_art(ART / slug, "cover")
    if not src:
        sys.exit(f"Missing cover: put cover.png/jpg/webp in {ART / slug}")
    out = PUBLIC / slug
    out.mkdir(parents=True, exist_ok=True)
    cover = fit(Image.open(src), COVER)
    cover.save(out / "cover.webp", "WEBP", quality=80, method=6)

    # Share card: cover on the left, title and hook on the right.
    card = Image.new("RGB", SHARE, NIGHT)
    thumb = fit(cover, (420, 630))
    card.paste(thumb, (0, 0))
    d = ImageDraw.Draw(card)
    x, w = 470, SHARE[0] - 470 - 60
    d.text((x, 70), "CAIRN", font=font(26), fill=YELLOW)
    y = 120
    for line in wrap(d, title, font(64), w)[:2]:
        d.text((x, y), line, font=font(64), fill=INK)
        y += 74
    y += 16
    for line in wrap(d, hook, font(30, bold=False), w)[:5]:
        d.text((x, y), line, font=font(30, bold=False), fill=(200, 194, 184))
        y += 40
    d.text((x, SHARE[1] - 80), "Stories that won't let you go.", font=font(26), fill=YELLOW)
    card.save(out / "share.jpg", "JPEG", quality=85, optimize=True, progressive=True)
    print(f"  cover.webp, share.jpg -> {out}")


def write_issue(slug: str, issue: int, free: int) -> None:
    src_dir = ART / slug / f"issue-{issue}"
    out = PUBLIC / slug / f"issue-{issue}"
    # Start clean so a page that should no longer be free can't linger on the site.
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for n in range(1, free + 1):
        src = find_art(src_dir, f"page-{n:02d}")
        if not src:
            sys.exit(f"Missing free page {n}: put page-{n:02d}.png/jpg/webp in {src_dir}")
        fit(Image.open(src), PAGE).save(out / f"page-{n:02d}.webp", "WEBP", quality=78, method=6)

    locked = find_art(src_dir, f"page-{free + 1:02d}")
    if not locked:
        sys.exit(f"Missing page {free + 1} (the lock teaser) in {src_dir}")
    # Shrink hard, blur, darken: the detail is gone from the file itself, not hidden by CSS.
    small = fit(Image.open(locked), (90, 135)).filter(ImageFilter.GaussianBlur(3))
    teaser = small.resize(TEASER, Image.BICUBIC).filter(ImageFilter.GaussianBlur(18))
    teaser = Image.blend(teaser, Image.new("RGB", TEASER, NIGHT), 0.35)
    teaser.save(out / "teaser.webp", "WEBP", quality=60, method=6)
    print(f"  pages 1-{free} + teaser.webp -> {out}")


# ── Placeholder art (stands in until the real art is ready) ──────────────────

def fake_page(label: str, sub: str, size: tuple[int, int], accent=YELLOW) -> Image.Image:
    img = Image.new("RGB", size, (24, 24, 28))
    d = ImageDraw.Draw(img)
    w, h = size
    m = int(w * 0.05)
    # Comic-style panel grid
    rows = [(m, m, w - m, int(h * 0.38)), (m, int(h * 0.38) + m // 2, int(w * 0.5) - m // 4, int(h * 0.7)),
            (int(w * 0.5) + m // 4, int(h * 0.38) + m // 2, w - m, int(h * 0.7)), (m, int(h * 0.7) + m // 2, w - m, h - m)]
    for box in rows:
        d.rectangle(box, outline=(70, 70, 78), width=max(3, w // 200))
    size = int(w * 0.13)
    f = font(size)
    while d.textlength(label, font=f) > w * 0.86 and size > 12:  # long titles shrink to fit
        size -= 2
        f = font(size)
    tw = d.textlength(label, font=f)
    d.text(((w - tw) / 2, h * 0.42), label, font=f, fill=accent)
    fs = font(int(w * 0.035), bold=False)
    for i, line in enumerate([sub, "PLACEHOLDER"]):
        tw = d.textlength(line, font=fs)
        d.text(((w - tw) / 2, h * 0.42 + w * 0.17 + i * w * 0.05), line, font=fs, fill=INK)
    return img


def make_placeholders(slug: str, title: str, issue: int | None, total: int) -> None:
    (ART / slug).mkdir(parents=True, exist_ok=True)
    fake_page(title.upper(), "COVER", COVER).save(ART / slug / "cover.png")
    if issue:
        d = ART / slug / f"issue-{issue}"
        d.mkdir(parents=True, exist_ok=True)
        for n in range(1, total + 1):
            fake_page(f"PAGE {n}", f"{title} · Issue {issue}", PAGE).save(d / f"page-{n:02d}.png")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("mode", choices=["prepare", "cover", "placeholder"])
    p.add_argument("--slug", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--hook", default="")
    p.add_argument("--issue", type=int)
    p.add_argument("--free", type=int, default=3)
    p.add_argument("--total", type=int, default=10, help="placeholder only: pages to fake")
    a = p.parse_args()

    print(f"{a.slug}:")
    if a.mode == "placeholder":
        make_placeholders(a.slug, a.title, a.issue, a.total)
    write_cover(a.slug, a.title, a.hook)
    if a.mode in ("prepare", "placeholder") and a.issue:
        write_issue(a.slug, a.issue, a.free)


if __name__ == "__main__":
    main()
