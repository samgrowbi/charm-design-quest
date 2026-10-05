# Architecture rules

- The app has no global chatbot or chatbot cloud function because the Sofia experience was intentionally removed.
- Treatment-specific result photos belong in treatment configuration; shared fallback assets remain until no other treatment uses them, preventing cross-page photo changes.
- Portrait Baggy Eyes composites are split and given centered horizontal image margins before upload so existing cover-fit cards preserve both original halves at every breakpoint.
- Hero HLS sources load immediately using native playback where supported and hls.js elsewhere; video URLs and optional posters stay treatment-specific to avoid cross-page media changes.
- Who We Are image overrides belong in treatment configuration and fall back to the shared image so treatment-specific replacements do not affect other pages.