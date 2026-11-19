# GardenQuote AI (demo MVP)
Rename the product in `config/demo.ts`.

## Run
```
npm install
cp .env.example .env.local   # optional; empty = demo mode
npm run test && npm run lint && npm run dev
```
Open http://localhost:3000 (landing), /quote (visitor widget), /dashboard (company config).

## Real vs simulated
Real: quote flow, EXIF-stripping image re-encode, validated API route, deterministic pricing engine, editable price list, NL/EN, PDF download.
Simulated: demo analysis (no key; labelled in the UI). Dashboard data is in memory only; it resets on reload and is not applied to a real embedded widget.
AI: set `ANTHROPIC_API_KEY` to send photos to Anthropic for analysis. AI never provides prices.

## Privacy: remaining considerations (this is NOT a GDPR-compliance claim)
Photos and descriptions go to the AI provider when a key is set; hosting (e.g. Vercel) keeps request logs incl. IPs; images are processed in memory only; DPA/legal review needed per provider.

## Before Vercel
Run `npm install`, `npm run build`, fix any type errors (code was written without a build environment); add real per-company config storage, embeddable widget (iframe/script), auth for the dashboard, and a hosted rate limiter.
