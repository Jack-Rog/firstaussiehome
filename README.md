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
3. For the linked Supabase project `FirstAussieHome` (`hhwwraqiapittuzfkpfd`), use the pooled connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL`.
4. Set `USE_MEMORY_DB=false` anywhere you want the app to use Supabase instead of demo memory mode.
5. Run `npm run prisma:generate` during the build step if the deployment environment does not do it automatically.
6. Add the Stripe webhook endpoint to `/api/stripe/webhook`.

## Environment variables

- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
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

If `DATABASE_URL` is empty or `USE_MEMORY_DB=true`, the app runs in in-memory demo mode. This keeps `npm run dev` usable without Resend, Stripe, or a database.

```bash
npm install
npm run dev
```

### Full local mode

1. Copy `.env.example` to `.env` if needed, then replace `[YOUR-SUPABASE-DB-PASSWORD]` in both Supabase connection strings.
2. Set `USE_MEMORY_DB=false`.
3. Run `npm run prisma:generate`.
4. The Supabase schema for this repo has already been applied via MCP. Use `npm run prisma:migrate` only for future schema changes.
5. Add real Auth and Stripe credentials.

### Supabase project wiring

- Project ref: `hhwwraqiapittuzfkpfd`
- API URL: `https://hhwwraqiapittuzfkpfd.supabase.co`
- `DATABASE_URL`: transaction pooler host `aws-1-ap-northeast-2.pooler.supabase.com:6543`
- `DIRECT_URL`: session pooler host `aws-1-ap-northeast-2.pooler.supabase.com:5432`
- The direct `db.hhwwraqiapittuzfkpfd.supabase.co` hostname did not resolve from this workspace, so Prisma CLI is configured against the reachable session pooler instead.

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
7. In a real integration environment, test Resend magic links, Stripe checkout, and a forwarded Stripe webhook.

## Real integration notes

- Resend magic links: use a verified sender for `EMAIL_FROM`.
- Stripe checkout: set `STRIPE_PRO_PRICE_ID` to the live recurring price ID.
- Stripe webhook: forward events for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
