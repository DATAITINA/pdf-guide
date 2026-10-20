# Cairn

Original African stories and comics, plus practical guides. Live at https://trycairn.vercel.app.
TanStack Start + React + Tailwind, deployed on Vercel. Read `CLAUDE.md` before changing anything.

```bash
npm install
npm run dev        # http://localhost:8080
npm test           # includes the check that no locked page or PDF is public
npm run build
```

## Adding a story

Every story lives in **one file**, `src/content/stories.ts`, plus its images. There is no database
for stories.

### 1. Put the full art in `art-src/` (never published)

`art-src/` is git-ignored, so nothing in it is committed or deployed.

```
art-src/<slug>/cover.png                 2:3 portrait (any size, png/jpg/webp)
art-src/<slug>/issue-1/page-01.png       one file per page, 2:3 portrait
art-src/<slug>/issue-1/page-02.png
...
```

`<slug>` is the story's web address name: lower case with dashes, e.g. `danfo-13`.

### 2. Make the website images

Needs Python 3 and Pillow (`pip install pillow`). Run it from the repo folder:

```bash
python scripts/stories/prepare_images.py prepare --slug danfo-13 --issue 1 --free 3 --title "Danfo 13" --hook "A ghost bus runs through Lagos at 3 a.m. ..."
```

This writes to `public/stories/<slug>/`:

| File | What it is |
|---|---|
| `cover.webp` | The cover, 800×1200 |
| `share.jpg` | The 1200×630 picture X and WhatsApp show when the link is shared |
| `issue-1/page-01.webp` … | **Only the free pages** (1 to `--free`), 1067×1600 |
| `issue-1/teaser.webp` | The first locked page, **blurred inside the file**, so it can't be un-blurred in a browser |

For a "coming soon" story with only a cover, use `cover` instead of `prepare` and leave out `--issue`.
To make labelled placeholder art first, use `placeholder` with the same flags.

### 3. Add one entry to `src/content/stories.ts`

Copy the Danfo 13 entry and change it: title, hook, tags, `kind` (`comic` or `story`), status
(`live` or `coming-soon`), and for each issue the page counts, prices, lock-screen words and the
Selar and Gumroad links. A link that still contains `TODO` shows "Checkout opens soon" instead of
sending readers to a dead page.

### 4. Check and ship

```bash
npm test
```

The story tests fail if an issue folder holds anything except its free pages and teaser, if a PDF is
anywhere in `public/`, or if a live issue is missing an image. Then open a pull request.

**Swapping in real art** for an existing story: replace the files in `art-src/<slug>/` and run step 2
again. Nothing else changes.

## Tracking

Vercel Web Analytics on the free plan counts page views only, so each step of the reading funnel is a
page view in the dashboard (Analytics → Pages):

| Step | Page |
|---|---|
| Started reading | `/read/[slug]/[issue]` |
| Reached the lock | `/read/[slug]/[issue]/lock` (logged when the lock scrolls into view) |
| Tapped "Unlock for ₦…" | `/out/[slug]/[issue]/selar` |
| Tapped "Unlock for $…" | `/out/[slug]/[issue]/gumroad` |

"Get told when it drops" signups appear in Admin → Waitlist under "<Story>: next issue".
