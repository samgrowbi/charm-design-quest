# Landing page image and compactness update

## Scope

- Update only the landing page result photos and requested landing page sections.
- Leave the Baggy Eyes and LED + Cryo result images unchanged.
- Preserve all copy, colors, fonts, forms, booking behavior, tracking IDs, routes, and unrelated sections.

## Changes

1. **Real People. Real Results**
   - Download the six supplied combined before-and-after photos into the project.
   - Split each photo at its center into matching before and after image files.
   - Configure the Instant Lift landing page with exactly six result cards in the supplied order.
   - Preserve the existing carousel, card dimensions, names and ages, badge, labels, slider behavior, aspect ratio, and image fit.
   - Add descriptive before and after alt text while retaining lazy loading.
   - Remove only the old face result imports and files that become unused.

2. **Remove Sofia**
   - Remove the floating Sofia button and chat window from the app.
   - Delete the Sofia interface, its unused image, and its dedicated cloud function.
   - Remove all Sofia imports and runtime references so no chatbot requests or console errors remain.

3. **Remove review platform branding**
   - Remove Google Maps, Yelp, and Trustpilot logo imports and their complete row from the About section.
   - Delete those three unused logo assets and ensure no empty spacing remains.

4. **Compact Who Is This For on mobile**
   - Below 768px only, reduce section padding, heading and body sizes, card padding, card gaps, and icon size by the requested proportions.
   - Keep tablet and desktop presentation unchanged.

5. **Compact five stats cards**
   - Reduce section spacing, card padding, icon circles, values, labels, and gaps across screen sizes.
   - Keep five cards in one desktop row.
   - Keep a compact two-column mobile grid and center the fifth card without tall full-width cards.
   - Preserve the pink accent, divider, content, and visual style.

## Verification

- Check the landing page at 1440px, 768px, and 375px for overlap, wrapping, spacing, and empty containers.
- Confirm the six result cards load in order and their comparison dialogs still work.
- Confirm the Baggy Eyes and LED + Cryo result images are unchanged.
- Confirm Sofia and all three platform logos are absent with no console errors.
- Confirm the existing Meta Pixel ID still loads and fires its page-view event.
- Confirm the preview build is healthy.
