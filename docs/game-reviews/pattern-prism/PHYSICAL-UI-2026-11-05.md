# Pattern Prism: cohesive light frame and physical pieces

James rejected the charcoal redesign: “Not good enough and it needs to maintain the overall Background of the other games to remain cohesive. Make it look a little bit more three-dimensional and Physical objects”. This supersedes the previous visual direction; it is not a keeper verdict or gameplay rating.

Restore the exact pale blue background, radial highlight, white panels, header, type and controls used by the other November game updates. The game-specific treatment lives on the pieces and their shallow trays. Pieces have muted satin finishes, a visible five-unit side wall, beveled rims and soft cast shadows. Choices have restrained raised/pressed states; empty predictions look recessed. The collection frame stays cohesive.

The existing four shape identities, four named colors, 0.67/1 size ratio, cardinal-direction arrows, cycles, answer indices and save schema remain. Piece geometry rotates in world coordinates so the highlight and shadow keep a consistent lighting direction. Every SVG gets distinct gradient/filter IDs so completed predictions cannot recolor another piece. No external images, fonts, 3D libraries or network dependency were added.

Five engine tests passed. Four complete Chrome/WebKit touch/keyboard solve-and-reload checks passed. Six Chrome/WebKit checks at 320, 393 and 1280 pixels passed for overflow, touch targets, unique SVG IDs, both hints, reveal and restoration. Those checks compare the computed body background color and image with Memory Maze and confirm an exact match. Native bundle parity passed for 33 entries and 308 files. Phone and desktop captures were inspected. Physical-device rendering has not been checked in this pass.

The background comparison initially caught a copied selector still targeting Memory Maze, before publication. The selector was corrected to Pattern Prism and the same six-case check passed. Review evidence retains the final checked state.

Published privately from Site source `4b2cd28db7a20e583537d03aa695273cec8940e7`; deployment `appgdep_6aec79beff9481919b2f7ca694ec51f2` succeeded. Two read-only hosted browser checks verified matching app, CSS and icon hashes, rendered pieces, no page errors, and an exact background match to the hosted Memory Maze at 393 and 1280 pixels. Hosted phone and desktop captures were inspected. URL: https://alford-daily.jbapckfan.chatgpt.site/games/qwen-pattern-prism/ .
