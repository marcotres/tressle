# Tressle

A public daily Nomi-Cose-Città-inspired word game, presented in English. This repository is the deployable application starter: Next.js frontend, server-side answer verification, and Supabase database schema.

## What is included

- Tressle Daily: one shared letter per UTC day, seven categories, 60-second round.
- Server-side validation: answers must begin with the daily letter and exist as verified entries in the word database for that category.
- Rarity Score: stored as a curated 1–100 value per category/word.
- Supabase schema for profiles, verified words, submissions and a daily ranking view.
- Responsive dark-purple interface.

## Important launch status

This is a working application foundation, not a finished public service yet. The database must be configured and populated with reviewed English vocabulary before scores can be trusted. Authentication/profile creation and score persistence are deliberately not faked: anonymous submissions are calculated but not added to the global leaderboard. The next setup steps below enable the backend.

## Run locally

1. Install Node.js 20.9+.
2. Create a Supabase project at https://supabase.com.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and fill in the project URL, anon key and service-role key. Keep the service-role key secret and server-only.
5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

6. Open http://localhost:3000.

Without Supabase credentials the daily letter route works, but answer submission returns a setup message.

## Word database and rarity

Import reviewed entries into `public.words`. Only rows with `verified = true` are accepted. `rarity_score` must be 1–100 and should be based on a documented English-language frequency corpus, with a category-specific validation source where appropriate. A practical model is to convert corpus frequency percentile to rarity (rare words score higher), then apply editorial review and category checks. Do not use a player's submitted answers as the source of truth for rarity.

The CSV in `data/word-import-template.csv` shows the required fields. It is a template, not a real dictionary. Avoid automatically marking imported words verified until source and category are checked.

## Production checklist

- Configure Supabase Auth (email magic link or OAuth), profile/username onboarding, and secure session handling.
- Add authenticated submission persistence with one submission per user per UTC challenge date.
- Build the live leaderboard from `daily_rankings`.
- Add rate limiting, abuse controls, moderation/reporting, and server-side duplicate/late-submission rules.
- Populate and maintain the verified word dataset; establish editorial policy for names, fictional characters, multi-word answers, spelling variants and proper nouns.
- Add privacy policy, terms, analytics consent where required, and backups.
- Deploy the Next.js app to Vercel and set the same environment variables there.

## Security notes

The Supabase service-role key is privileged and must never use a `NEXT_PUBLIC_` prefix. The current API uses it only on the server to read verified vocabulary. Before accepting public traffic, add rate limiting and complete authenticated score writes. RLS is enabled in the schema.
