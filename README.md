# Aussies First Home

Aussies First Home is a Next.js MVP for Australian graduates who want a guided way to learn personal finance and first-home concepts, with optional paid modelling for CSV import and readiness reporting. Tier 1 and Tier 2 provide general information and modelling only.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- MDX content with frontmatter
- Auth.js / NextAuth
- Stripe
- Prisma
- Vercel-ready deployment

## Vercel deploy steps

1. Import the repo into Vercel.
2. Set the environment variables from `.env.example`.
3. If using Postgres, add a Vercel Postgres connection string to `DATABASE_URL`.
4. Run `npm run prisma:generate` during the build step if the deployment environment does not do it automatically.
5. Add the Stripe webhook endpoint to `/api/stripe/webhook`.

## Environment variables

- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `DATABASE_URL`
- `USE_MEMORY_DB`
- `ENABLE_TEST_AUTH`
- `ENABLE_ALT_HOME_HERO`
- `ENABLE_ALT_ONBOARDING_RESULTS`
- `ENABLE_MONTH1_REPORT_EXPORTS`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

## Local development

### Demo mode

If `DATABASE_URL` is empty or `USE_MEMORY_DB=true`, the app runs in in-memory demo mode. This keeps `npm run dev` usable without Google, Resend, Stripe, or a database.

```bash
npm install
npm run dev
```

### Full local mode

1. Set `DATABASE_URL`.
2. Run `npm run prisma:generate`.
3. Apply migrations with `npm run prisma:migrate`.
4. Add real Auth and Stripe credentials.

## Tests

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Manual QA checklist

1. Load `/` and confirm the banner, hero, and primary CTA are visible.
2. Complete `/start` and confirm the path result appears.
3. Visit `/quiz/schemes` and confirm the result uses “may be eligible” wording plus official links.
4. Visit `/tools/deposit-runway` and confirm the slider changes the timeline.
5. Visit `/pricing` and confirm the dev message appears when Stripe vars are missing.
6. Use `/pricing` in demo mode and confirm `/model` unlocks after the local demo checkout path.
7. In a real integration environment, test Google sign-in, Resend magic links, Stripe checkout, and a forwarded Stripe webhook.

## Real integration notes

- Google OAuth: add the deployed callback URL in the Google Cloud console.
- Resend magic links: use a verified sender for `EMAIL_FROM`.
- Stripe checkout: set `STRIPE_PRO_PRICE_ID` to the live recurring price ID.
- Stripe webhook: forward events for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
