# Full-length English word source

Tangle now uses the union of this English source, Wordnik’s game list, ENABLE2K and six publicly documented Zynga examples: **409,097 distinct entries** before Tangle’s length/path/exclusion rules. This applies to current/future 4×4 Daily, all Practice boards and the optional 5×5 sample. Earlier dated editions and earned Gold targets are preserved. Other games retain their existing dictionaries.

Additional pinned sources:

- [Wordnik game list](https://github.com/wordnik/wordlist/tree/46e6215d0f90356afe9c8ba4be347e7e98cb425c): 198,422 entries. The original file is JSON-per-line (quoted words), parsed with `JSON.parse`; it is retained unchanged as `wordnik-game-words.txt`. [MIT license](wordnik-LICENSE.txt).
- [ENABLE2K mirror](https://github.com/BartMassey/wordlists/tree/af52415c13af809bd8757a40f17f46e79d09583c): 173,528 entries, retained as the original gzip. Alan Beale and M. Cooper placed the list in the public domain; [original documentation and attribution](enable2k-README.txt), [mirror license](enable2k-mirror-LICENSE.txt).
- [Zynga’s disclosed examples](zynga-disclosed-words.json): six factual examples from its rulebook and October 8, 2026 update. This authored JSON is not an export or license of its full NASPA/custom lexicon. Zynga’s actual current accepted set is not supplied or certified here.

[`word-game-sources.json`](word-game-sources.json) indexes the actual downloaded commits and SHA-256 hashes for all three upstream sources and notices. Generation and the independent audit reject source bytes that do not match those pins. Staging also verifies each license/attribution checksum and bundles all four notices verbatim in `games/kimi-runtime/assets/word-lists-LICENSE.txt`, including offline/native Web distributions. The large upstream source files remain build/test inputs and are absent from the staged website.

`english-words-alpha.txt` is the unmodified `words_alpha.txt` from [dwyl/english-words](https://github.com/dwyl/english-words/tree/20f5cc9b3f0ccc8ce45d814c532b7c2031bba31c), revision `20f5cc9b3f0ccc8ce45d814c532b7c2031bba31c`, retrieved October 31, 2026. The accompanying source receipt records byte counts and SHA-256 hashes. Its supplied [license](english-words-LICENSE.md) is retained.

The existing Cairn dictionary contains 97,109 entries of three through seven letters, all present in this 370,105-entry source. The browser receives only precomputed Tangle words with valid paths on each board. It does not download the expanded source files or call a dictionary service.

Regenerate all Tangle extensions and the sample with `node scripts/generate-tangle-lexicon.mjs`; the older sample-only command remains available. From `packages/kimi-pebbles`, run `node --import tsx ../../scripts/audit-tangle-lexicon.mjs /absolute/report.json` for the independent word-centric audit across all 430 grids and the sample. The original four-wide source records stay intact; an extension layer widens acceptance from October 31, 2026 and immediately in Practice. The existing closed Tangle exclusion policy is retained. Source membership does not establish familiarity, current usage, completeness of English or exact Words With Friends parity.
