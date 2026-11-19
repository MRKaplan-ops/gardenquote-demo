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

## v2 notes
Price table has Dutch/English names per activity (`names` in `config/demo.ts`). Demo analyzer reads keywords (NL/EN) and splits the total area over the selected work. Totals are rounded to the nearest €50 (`roundTo`, 0 = off). Quantities are editable on the estimate screen.

## v3 notes
Company settings persist in `sessionStorage` after "Instellingen opslaan" (visitor input is never persisted). Tiers: 0.85x / 1.0x / 1.3x on material activities, ±7% margins (dashboard), rounded to €50. The advice modal opens the visitor's own email app (mailto), so nothing is stored or sent by us. The before/after visualisation is demo-only (user photo vs sample illustration); real image generation is not implemented yet.

## v4 notes
Estimate quantities are read-only for visitors. Step 2 leads with the style make-over option (description optional when inspiration photos are uploaded). The visualisation opens on a default style. Demo analyzer: specific words in the description override broad project types; "keramische" shows the variant name "Keramische bestrating / terras aanleggen".
