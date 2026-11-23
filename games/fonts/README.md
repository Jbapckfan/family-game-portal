# Local web fonts

Offline copies of the Google Fonts the portal games use, so the games look the same with no
network. Latin subset only (the same file a browser would fetch for English text).

- Families: Fredoka One, Inter, Nunito, Orbitron, Outfit, Press Start 2P, Rajdhani, Space Mono.
- Source: the Google Fonts css2 API (fonts.googleapis.com / fonts.gstatic.com), fetched
  2026-11-22. Fonts are unmodified.
- Licence: SIL Open Font License 1.1; each family's licence text is in `licenses/`
  (from github.com/google/fonts; Fredoka One's from that repo's history, since the family was
  later replaced by Fredoka).
- Use: `<link rel="stylesheet" href="<relative path>/games/fonts/fonts.css">`.
