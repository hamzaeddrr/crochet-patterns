# Loopcraft — Crochet Patterns

Public crochet pattern website with an **admin-only** AI studio and Stripe unlock for paid patterns.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- next-intl: **English** (default), French, Spanish
- OpenAI: `gpt-5-mini` (text) + `gpt-image-2.5-flare` (images) — overridable in Admin → Settings
- Stripe Checkout (one pattern → unlock cookie + PDF)
- Stitch-count validator + PDF export
- JSON stores in `data/` (`site-content.json`, `admin-settings.json`, `purchases.json`)

## Setup

```bash
npm install
cp .env.example .env.local
# ADMIN_PASSWORD, ADMIN_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL
# Stripe: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Checkout success hits `/api/checkout/confirm` which sets the unlock cookie; the webhook also records the purchase for audit.

## Admin workflow

1. Sign in at `/admin/login`
2. **Settings** — models, keys, default price, Stripe
3. **AI Generate** — optional subject or creative mode → one-shot pattern + image + FR/ES + PDF
4. Review in **Pattern library** — price, free flag, status, re-translate, regenerate image
5. Publish → public teaser; buyers unlock full rounds + PDF

Also: **Categories**, **Pages & SEO**, **Translations**, **Purchases**.

## Notes

- Paid access is cookie-based (no user accounts). JSON on Vercel is ephemeral — use Blob/DB for production persistence later.
- Brand: **Loopcraft**
