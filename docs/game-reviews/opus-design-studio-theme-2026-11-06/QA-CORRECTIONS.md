# Codex integration corrections to the Opus revision

- Site B at 320px: the Feedback link and profile button pushed the header to 343px. Applied the live home's 23px brand / 34px logo breakpoint and an accessible icon-only Feedback link at that width. The header now fits; all four site concepts pass 320, 760, 1100 and 1280px checks.
- Removed Site B's “ready when you are” phrase to honor James's earlier request to omit redundant readiness messages.
- Claude Tangle's second thread uses the existing home blue #355fa7 instead of a newly introduced violet, respecting the earlier no-purple preference while keeping three labeled, distinct threads.
- Embedded the existing home font files in a shared CSS asset for sandboxed preview frames. A direct URL font request failed from the opaque frame origin; the identical embedded font loaded. The sandbox remains without same-origin access. Font, logo and captured CSS hashes match the actual public baseline.
- The gallery frame, source reference, cache versioning and choice-storage namespace are Codex integration work. Opus authored the concept revisions.
- WebKit reports intentionally cancelled iframe requests as “cancelled”; Chromium uses “net::ERR_ABORTED”. The gallery harness classifies both as navigation cancellations and still fails unexpected network errors.

- The gallery wordmark originally inherited the browser’s blue link color. It now explicitly uses the main-page charcoal; both browser checks assert that computed color. The root stylesheet URL is versioned again for this small correction.
