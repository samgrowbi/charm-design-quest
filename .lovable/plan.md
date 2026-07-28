
# Task 2 - Full brand + treatment replacement, fixes, webhook

## Inputs collected (from you)
- Brand: Hermosa Medspa, Auburn WA, 1001 Outlet Collection Way, (253) 263-1162
- Email: booking.nwcosmetics@gmail.com
- IG: nw.cosmetics / FB: profile.php?id=61581351143541
- Hours: Mon-Sat 10:00 AM - 06:00 PM, Sun 11:00 AM - 06:00 PM
- Meta Pixel: 1977038163053432
- Timezone: America/Los_Angeles
- Acuity: Instant Lift 91900403/cal 11251085 · Baggy Eyes 89864520/cal 12769252 · LED+Cryo 91285301/cal 12769252
- Treatments (3): Instant Lift $79.99/75min, Baggy Eyes $69.99/60min, LED+Cryo $89.99/60min
- Logo/favicon: copy from NW Cosmetics V2
- OG image: auto-generate

## Scope

### A. Sitewide brand replacement
- Rewrite `src/config/brand.ts` (name, address, city, phone, email, socials, hours, maps link + embed).
- Update `index.html` `<title>`, `<meta name=description>`, all `og:*`/`twitter:*`, JSON-LD (Organization + LocalBusiness).
- Meta title template: `Hermosa Medspa | {Treatment Name}` - update the meta helper used per page.
- Update `.lovable`/memory brand core rules to Hermosa (color palette stays pink, unless you say otherwise).

### B. Treatment surface rewire (3 total)
- Keep `/` and `/instant-lift` -> Instant Lift.
- Add new `/baggy-eyes` route + page + `/book/baggy-eyes` + `src/config/baggyEyes.ts`.
- Keep `/led-cryo` + `/book/led-cryo`, update copy/price to $89.99/60min (already close).
- Delete `/led`, `/body-sculpting`, `/book/led`, `/book/body-sculpting` routes + their page files + configs. Remove them from `treatmentRegistry.ts`.
- Update `TreatmentContext` + `treatmentRegistry.ts` with the 3 live treatments' names, prices, durations, appointment type IDs, calendar IDs, copy pulled from hermosa-medspa.com.
- Sitewide `#Spa in [City]` -> `#1 Spa in Auburn`.

### C. Assets
- Copy `hermosa-medspa-logo.png` and favicon from NW Cosmetics V2 into `src/assets/` and `public/`.
- Wire logo into Navbar/Footer, wire favicon into `index.html`, remove old GLO+ logos.
- Generate new 1200x630 OG image for Hermosa; save `public/og-image.jpg`; delete any leftover Elixir OG references.

### D. Reviews
- All review objects that carry a date get replaced with a random date in the last 30 days (no visible pattern). Applies to home + treatment pages.

### E. Off-by-one date bug
- Audit booking + reschedule date pickers for `toISOString`/UTC pitfalls; force local-date formatting (`format(date, "yyyy-MM-dd")` via date-fns) when sending to Acuity so the booked date == selected date in America/Los_Angeles.

### F. Meta CAPI Purchase on "Checked in" / "Arrived"
- Extend the existing Acuity offline webhook edge function: when `action` = `appointment.changed` and `label` is `Checked in` or `Arrived` (or similar Acuity status), send Meta CAPI `Purchase` event with `value` = treatment price (looked up by appointment type ID via `treatmentRegistry`) and `currency: USD`. Hash PII (email, phone, fn, ln) per Meta spec. Dedupe with `event_id = purchase_{appointmentId}`.

### G. Dashes
- Replace every `—` (em) and `–` (en) with `-` across `src/`, `supabase/functions/`, `index.html`, and memory files.

### H. Webhook for Acuity "catch all"
- Reuse (or create) the existing offline-conversions edge function URL. I'll give you the URL to paste into Acuity's Integrations > Webhooks > "Any change" (catch-all).
- **STOP** and wait for you to confirm it's added before Task 3.

## Technical notes
- Route change list in `src/App.tsx`: add BaggyEyes + BookBaggyEyes imports/routes; delete Index (LED), BodySculpting, BookLed, BookBodySculpting routes and remove unused imports.
- Files to delete: `src/pages/Index.tsx` (LED page), `src/pages/BodySculpting.tsx`, `src/pages/BookLed.tsx`, `src/pages/BookBodySculpting.tsx`, `src/config/led.ts` if present.
- Files to add: `src/pages/BaggyEyes.tsx`, `src/pages/BookBaggyEyes.tsx`, `src/config/baggyEyes.ts`.
- Reviews live inline in the Reviews component; regenerate with `Math.random`-picked dates at build time and hardcode them so the layout stays static.
- The offline-conversions webhook already exists (uses `META_CAPI_ACCESS_TOKEN`). I'll extend, not recreate.
- No changes to: pink brand palette, Playfair headings, sticky BOOK NOW button copy, 100px horizontal padding, or the Sofia chatbot (that's Task 3).

## Deliverable at end of Task 2
- All brand info replaced.
- 3 treatment surfaces live, old ones gone.
- New OG image + favicon + logo wired.
- Reviews randomized within last 30 days.
- Off-by-one date bug fixed in book + reschedule.
- Meta CAPI Purchase event wired for Checked in / Arrived.
- No em/en dashes anywhere.
- Webhook URL posted to you.
- Task **stops** and waits for your confirmation Acuity is configured.

Reply "go" to execute, or send edits.
