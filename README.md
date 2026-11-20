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

## v5: activate real AI on Vercel
1. Vercel → your project → Settings → Environment Variables. Add (Production + Preview):
   - `ANTHROPIC_API_KEY` = your Anthropic key → real *tuinontwerper* photo analysis (`/api/analyze`).
   - `OPENAI_API_KEY` = your OpenAI key → real "after" renders (`/api/visualize`, `gpt-image-1` edits your photo) and photo analysis if no Anthropic key.
   - Optional: `OPENAI_IMAGE_MODEL`, `OPENAI_VISION_MODEL`, `ANTHROPIC_MODEL`, or `REPLICATE_API_TOKEN` for images instead of OpenAI.
2. Redeploy (env changes only apply to new deployments).
3. Image generation can take 20–60 s; routes set `maxDuration=60` (check your Vercel plan limits).
Without keys the app runs in labelled Demo Mode. With keys, photos go to the provider(s) and are not stored by us; mention this in your privacy policy.

## v6: photorealistic visuals only (no drawings anywhere)
- **Visualisation**: `/api/visualize` needs `OPENAI_API_KEY` (or `REPLICATE_API_TOKEN`). It sends the current garden photo + inspiration photos to `gpt-image-1` (image edit), retries without `input_fidelity`, then falls back to `dall-e-3` (text-only). Without a key the section says AI is not configured; it never shows a drawing. If generation fails the UI shows the OpenAI error code (e.g. `organization_must_be_verified`: `gpt-image-1` requires a verified OpenAI organization; verify it in the OpenAI dashboard, or set `OPENAI_IMAGE_MODEL=dall-e-3`).
- **"Laad voorbeeldproject"** loads `public/sample-garden.jpg`. Create it once with `OPENAI_API_KEY=sk-... npm run sample`, or copy any real landscape JPEG of a dated Dutch backyard to that path, and commit it.

## v7 notes
- `public/sample-garden.jpg` is bundled so "Laad voorbeeldproject" works out of the box. It is a **procedurally rendered stand-in (not a real photograph)** made by `scripts/render-sample.py`. For a real look: `OPENAI_API_KEY=sk-... npm run sample` (AI photo) or copy any real JPEG over it.
- `/api/visualize` uses minimal OpenAI parameters: `gpt-image-1` (image edit with your photos, then plain generation) and finally `dall-e-3` with `response_format: b64_json`. Exact OpenAI errors are logged server-side (`openai image error ...`). Optional `OPENAI_IMAGE_SIZE` (default `1024x1024`).
- AI and demo analysis now return single point quantities; only the dashboard margins (`Marge onder/boven %`, default 7/7) widen the price range.

## v8 notes
- `/api/visualize` calls `dall-e-3` directly (`size 1024x1024`, `response_format b64_json`). It cannot take photos: the prompt is built from the AI's text description of the garden (`scene`), inspiration notes, the style and the finishing tier. Only text leaves your server for this step (no photo). `OPENAI_IMAGE_*` variables are no longer used.
- Price list uses material classes (`paving_basic/comfort/luxury`, `decking_*`); the selected tier picks the class. Saved dashboard settings from older versions keep the old price list: press "Demo-data herstellen" once.
- "Laad voorbeeldproject" now only loads `/sample-garden.jpg` (no pre-filled text or area).

## v9: debugging /api/visualize
Every response contains `v:"visualize-dalle3-v9"`. If you do not see it in the browser (DevTools → Network → /api/visualize), Vercel is still serving an older deployment. On errors the response and the screen show OpenAI's `code`, `param` and `message`, plus `sent` (the exact keys posted: model, prompt, n, size, response_format).
