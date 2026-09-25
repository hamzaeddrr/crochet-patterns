# Loopcraft — Crochet Patterns

Public crochet pattern website with an **admin-only** AI studio.

Visitors browse and download patterns. Only you generate content from `/admin`.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- next-intl: **English** (default), French, Spanish
- OpenAI: design spec + pattern JSON + product images + translations
- Stitch-count validator
- PDF export (pdf-lib)
- JSON file store in `data/site-content.json` (easy local start)

## Setup

```bash
npm install
cp .env.example .env.local
# edit ADMIN_PASSWORD, ADMIN_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- FR: `/fr` · ES: `/es`

## Admin workflow

1. Sign in at `/admin/login`
2. **AI Generate** — prompt → design spec → pattern → image → validate → PDF
3. Open the draft in **Pattern library**
4. Fix issues if validation warns
5. Set status to **published**
6. Pattern appears on the public site with SEO + PDF download

## SEO included

- Per-page metadata + Open Graph
- `hreflang` alternates (en / fr / es)
- JSON-LD on pattern pages
- `sitemap.xml` + `robots.txt`
- Canonical URLs via `NEXT_PUBLIC_SITE_URL`

## Project layout

```
src/app/[locale]/     # public pages
src/app/admin/         # studio (not for clients)
src/app/api/admin/     # generate, patterns, auth
src/lib/ai/            # design spec, pattern, image, translate
src/lib/crochet/       # stitch validator
src/lib/pdf/           # PDF builder
messages/              # en, fr, es UI strings
data/                  # site-content.json
public/patterns/       # images + PDFs
```

## Notes

- AI patterns start as **drafts**. Mark **tested** after you crochet them.
- Clients never get AI generate access — only the public catalog.
- Brand: **Loopcraft** (independent look from FillAndColor).
