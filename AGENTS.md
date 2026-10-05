# Architecture rules

- The app has no global chatbot or chatbot cloud function because the Sofia experience was intentionally removed.
- Treatment-specific result photos belong in treatment configuration; shared fallback assets remain until no other treatment uses them, preventing cross-page photo changes.
- Portrait Baggy Eyes composites are split and given centered horizontal image margins before upload so existing cover-fit cards preserve both original halves at every breakpoint.