# Revision 2: director outputs follow the live home theme
Opus 5.5 · 2026-11-06 · a focused style correction, not a new architecture.

**James's feedback:** "these don't follow the basic style of the overall website, so they are distracting. follow the overal theme of the website/background and colors we are using on the main page, try again."

**Authority used:** `input/REVISION-02.md`; the two fresh captures `home-top-1440.png` and `home-top-393.png` (viewed), plus `home-1440.png`; `computed.json`; `0-styles.css`; `1-identities.css`; the live `home.html` brand markup; `assets/site-theme.css`; and `assets/brand.svg`.

## What the home actually is (and what the concepts now use)
- **Page:** paper `#f6f3ec` with no gradient. Body is DM Sans and ink `#202c35`.
- **Cards:** warm-white `#fffefa`, a 1px `#dcded8` line, 22px corners, a resting `0 6px 0 #202c3505` shadow and a soft hover lift.
- **Wordmark:** the brand tile plus "Alford **Daily**" in DM Serif 30px, with "Daily" in green `#376c58`.
- **Hero heading:** DM Serif with one italic green phrase.
- **Eyebrows:** small uppercase tracked DM Sans in muted `#5b666c`.
- **Controls:** the ink pill (Share), green "Play today ↗" with a wash chip, the creator-filter segment (warm-white container, ink pressed state), 8px-radius bordered preference buttons, and the clay ↗ text link.

## Changes by file
**site-A/B/C/D.html.** Every inline `<style>` was rebuilt and the old cool palettes deleted. `../assets/site-theme.css` is now the **last** element in each `<head>`. Specific changes:
- **Brand and type:** the brand is now `../assets/brand.svg` plus the home wordmark, identical in all four. The bespoke SVG logos and system/Avenir font stacks are gone. Headings, the wordmark and game names use DM Serif 400; everything else uses DM Sans.
- **Removed surfaces:** the white full-width "sheet" (A), radial gradient and inset/keycap hardware (B), blue-grey work area and navy brand tile (C), and blue plate shadows (D).
- **One control vocabulary across A–D:**
  - ink pill for primary actions
  - green Play ↗ for opening a game
  - warm-white bordered secondary buttons
  - the home segment for All / Favorites / Hidden
  - green-wash kind chips with ✓
  - text toggles: "☆/★ Favorite" and "Hide/Unhide"
  - a 3px green focus ring
- **Icons and identity:** Today's Three uses the home's own icons (`../assets/icons/SLUG.svg`) instead of custom blue-stroke icons. Each game's home identity colour appears only on its category eyebrow.
- **Board semantics kept local:** the Second Sense noun/verb hues inside D's miniature. Sideways' column guides are now green.
- **Spelling:** UI spelling follows the home ("Favorites", "neighbors").
- **Share text:** column alignment that relied on monospace was dropped, because DM Sans is proportional.
- **What each layout keeps:**
  - **A Ledger:** paper-only ruled rows; the home's tilted daily-edition card becomes the day counter.
  - **B Tray:** home cards in a `#eeeee6` well; a card grid plus a ruled List mode.
  - **C Console:** paper rail; a sticky home-card detail pane, so it is no longer a full-height panel; the table sits inside a home card.
  - **D Specimen:** home cards with paper-inset miniatures.
- **Controls whose behaviour changed:**
  - C's pane used to list "Enter: Play selected", which was not wired. Enter is now wired to open the selected game's details, and only when focus isn't on a button or link. Rows gained a real button per game name, so they are keyboard reachable. Esc is listed. Shortcuts ignore modifier keys.
  - B's layout switch was renamed from "Keys/List" to "Cards/List". Its radiogroup now uses a roving tabindex with wired arrow keys.
  - All other controls keep their previous local behaviour. Inert controls are still labelled inert. The feedback receipt still never shows success.

**design-system.json.** Rewritten around one shared frame: tokens, typography, brand, control vocabulary, identity versus board-semantic colour rules, and the banned list. A–D are described as layouts within it. B stays recommended, now because it is the smallest step from the live home.

**all-games-review.json.** Theme conclusions corrected, with mechanics, priorities and dispositions unchanged:
- **Template finding reversed:** the cream templates are closest to the home, and the pale-blue bold-sans one is the outlier.
- **Navy/cream chrome note:** reworded.
- **Kimi beige buttons:** now a control-consistency issue, not a warmth issue.
- **Smaller wording fixes:**
  - Switchpath END cell: no longer called a broken "no-brown" rule.
  - Cairn: "Tray grammar" wording updated.
  - Morph: "cool frame" wording updated.
  - Hunch: clarified that the ban is on green/yellow *letter feedback* only.

**HANDOFF.md.** The frame rule, controls, colour roles and material rules now follow the home. The cream/beige ban is withdrawn, and "off-theme frame" is added as the first anti-pattern.

## Limits
- I did not open these pages in a browser or inspect them rendered. The parent session runs 393px and 1440px QA.
- Things to check in that QA:
  - DM Serif wraps in A's two-line date and in B/D's 56–58px headings.
  - C's three-column fit at 1240–1440px.
  - The height of the Second Sense miniature in D at 393px.
  - The Favorite/Hide footers in B's four-column grid near 1100px.
- `site-theme.css`, root files and team folders were not edited. Only `director/` changed.
