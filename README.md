# Natalie Winger

Webshop for handmade beaded jewellery. Built with React + Supabase + Stripe, deployed on GitHub Pages at [nataliewinger.com](https://www.nataliewinger.com).

## Stack

- **Frontend** — React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend** — Supabase (Postgres + Auth + Storage + Edge Functions)
- **Payments** — Stripe (Payment Intents)
- **Shipping** — Bring API for rates and postal code validation
- **Email** — Nodemailer via a Supabase Edge Function (Gmail SMTP)

## Getting started

```bash
npm install
npm run dev
```

You'll need a `.env` file with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

The Edge Functions need their own secrets set in Supabase:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SUPPORT_EMAIL`, `BRING_API_UID`, `BRING_API_KEY`.

## Project structure

```
src/
  pages/          # Route-level components
  components/     # Shared UI pieces
  contexts/       # Cart, language, nav state
  services/       # Supabase query functions
  interfaces/     # TypeScript types
  i18n/           # Norwegian/English translations

supabase/
  functions/      # Edge Functions (payments, webhooks, shipping, email)
  migration.sql   # DB schema
```

## Deploying

```bash
npm run build
npm run deploy
```

Builds and pushes to the `gh-pages` branch. The CNAME file points GitHub Pages to `nataliewinger.com`.
