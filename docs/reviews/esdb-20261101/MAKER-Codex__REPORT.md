# ESDB/SCOWL supplemental word-source research

November 1, 2026. Research only. No game source, runtime, installed model, dependency, service or main checkout was changed. Downloaded files were read as text/JSON; no downloaded code was executed.

## Concrete source and pins

The official [ESDB site](https://wordlist.aspell.net/) links its [prebuilt dictionaries page](https://wordlist.aspell.net/dicts/), which identifies plain wordlists on GitHub in the maintainer's [wordlist-diff repository](https://github.com/en-wl/wordlist-diff). It calls 2026.02.25 the latest released dictionary version. The repository also holds a newer generated snapshot; these are kept separate here.

- Current generated snapshot: **7f2f4078354752045ee16a041605686561122185**, committed June 25, 2026.
- Its commit message maps to the actual source revision **1e5b7d3a72f47a71da5d28686c1dd4b397178485**, dated June 24, 2026.
- Released `rel-2026.02.25` generated snapshot: **71d7dd07676edb60ade43552e10b41314b7e9287**. Its message maps to source **7e99edab8e32f9f9ea2b15f249ca8d4d67237410**.
- Current generated `Copyright` and corresponding source `Copyright` are byte-identical: SHA-256 **71bffd4b74ad47fff01c8b3c666e77da92737854e568850d8728024e0a53f304**, 4,903 bytes.
- The release's different exact `Copyright` is also retained: SHA-256 **090575a131b4260926c7a6b30a90aca0f5db5fbb5c46778e0c5855227bf6ebc3**.

The generated repository says its history can be rebuilt and commit IDs are not permanent archival guarantees. Retain these exact local files and checksums; do not make future game generation depend on a moving branch or a live request.

Current plain-list candidate files, downloaded directly from the fixed generated commit:

| File | Raw SHA-256 |
|---|---|
| `en_US.txt` | `45a4dd29b86234fbabce26f33272466bb5572db6fdca1470c4f218e6b666a56d` |
| `en_US-large.txt` | `815abb6f1855304a6c3f358aa1e5ce85823140a547226ce4114386f9b796c30f` |
| `en_GB-large.txt` | `e89e38c3685ba5830f76d804cd6998ba7048d734bd92a97f24855d96b6d26d20` |
| `en_CA-large.txt` | `ca1258552a81db34951374deafaa67bd676a02f0e1a026b14855f6042e46d47d` |
| `en_AU-large.txt` | `16a868afb85faa109be217cae3cf506d7d4eafe128a3a5fbf335ef5ee6d6c73e` |

Every raw URL is `https://raw.githubusercontent.com/en-wl/wordlist-diff/7f2f4078354752045ee16a041605686561122185/FILENAME`. The exact corresponding copyright URL uses `Copyright` as FILENAME. All nine current plain lists, both released US lists, exact matching notices/readmes, source README, upstream commit metadata and original HTTP receipts are retained. See `MAKER-Codex__download-manifest.json` for every URL, byte count, hash and response header.

## Measured coverage against the existing corpus

The baseline was independently rebuilt from the retained pinned dwyl English, Wordnik, ENABLE2K inputs and six documented Zynga examples. Its source hashes matched the existing receipts and its distinct total is **409,097**.

For ESDB, the candidate parser accepts only original lines matching `^[a-z]+$`. It does not case-fold names/acronyms, strip punctuation, invent plurals or deaccent text. Existing baseline words remain intact. This is a supplemental union, not a replacement dictionary or a new universal editorial policy.

| Candidate | Eligible lowercase words | New words beyond baseline | New 3–7-letter words |
|---|---:|---:|---:|
| Released US size 60 (2026.02.25) | 79,343 | 894 | 217 |
| Current generated US size 60 | 79,454 | 905 | 221 |
| Released US size 70 | 126,764 | 3,698 | 493 |
| Current generated US size 70 | 128,295 | 3,898 | 592 |
| Current generated default size 60, all dialects | 82,470 | 1,487 | 277 |
| Current generated large size 70, US + GB + CA + AU | 133,206 | 5,186 | 650 |
| Current generated large size 70, US + GB + CA | 133,073 | 5,109 | 611 |

The four large regional lists already contain the same eligible union as all nine current lists. Adding those four to the baseline would yield **414,283** distinct words. An independent Node implementation verified all 18 download hashes and reproduced the Python comparison exactly.

| Length | Existing corpus | Supplemental additions | Proposed union |
|---|---:|---:|---:|
| 3 | 2,281 | 33 | 2,314 |
| 4 | 8,141 | 65 | 8,206 |
| 5 | 17,946 | 77 | 18,023 |
| 6 | 31,583 | 172 | 31,755 |
| 7 | 44,345 | 303 | 44,648 |

Both released and current default-US lists contain **emoji, emojis, twerk, twerks, twerked, twerking**. These are absent from the existing baseline. Other measured additions include **vape/vapes/vaped/vaping, livestream and its recorded inflections, smartwatch/smartwatches, crowdfund/crowdfunds, doomscrolling, sriracha, codebase/codebases, cisgender and neurodiversity**. The current large list also adds **wifi**. These are examples of a full-source difference, not an authored small repair list.

This source is still incomplete: **chatbot, chatbots, kombucha, doomscroll and doomscrolls** are absent from the baseline and from all nine downloaded current lists. **doomscrolling** is present. These membership checks are not judgments that the absent strings are invalid words. The complete measured coverage matrix, not just successful examples, is retained in `MAKER-Codex__coverage.json`.

Complete candidate difference lists are retained as `current_large70_all_dialects-additions.txt`, `current_default60_all_dialects-additions.txt`, `current_large70_non_AU-additions.txt`, `en_US-additions.txt`, and `en_US-large-additions.txt`.

## Format, variants and source-quality limits

The official page maps the default files to size 60, usually one preferred spelling per dialect. Large files map to size 70 and include common spelling variants. The maintainer warns that large dictionaries are less thoroughly checked and may include invalid/misspelled entries and uncommon words easily confused with common words. The source README says size 60 has been vetted; this is not a guarantee that each entry is suitable for a game.

The plain files include more than lowercase game words. For example, current US-large has **168,608** unique lines: **128,295** original lowercase ASCII words, **17,664** capitalized ASCII entries, **22,329** apostrophe forms, and **320** other non-ASCII forms. Blind case-folding would add **15,286** distinct ASCII strings not present in the lowercase subset, including names/acronyms. Keep the filter explicit and retain raw files unchanged.

Dialect handling matters: US lists include `color` but not `colour`, while the regional union includes both. Do not assume a US spell-checker is a complete game-English source. The existing corpus already covers many regional alternatives; the table measures actual additional coverage.

## License reading and integration implications

The matching source README describes the combined work as MIT-like. The exact retained `Copyright` grants use, copying, modification, distribution and sale without a fee, conditioned on retaining the stated copyright and notice in copies/supporting documentation, with an as-is disclaimer. For official non-Australian speller dictionaries the file says the notice before its first separator suffices. Australian data has an additional attribution/permission notice. The UKACD condition is stated for generated lists above size 80; these candidates are sizes 60/70. Database/POS distributions have separate conditional language, including WordNet.

Keep the complete exact `Copyright` with any selected source and with shipped derivative-list attribution. The file also states COCA-derived data was used under the author's NDA rights. This report records the author's stated terms; it does not provide independent legal clearance or eliminate third-party-rights uncertainty. No GPL dictionary or commercial WWF/NASPA dump was downloaded.

A viable source-backed next step is a **pinned, checksum-verified supplemental union**, preferably covering the chosen dialect policy rather than repairing only EMOJI/TWERK. Size 70 provides broader measured coverage but has the maintainer's explicit quality caveat. No implementation has been made in this task. If root adopts it, preserve authored target banks, constrained clue/category answers, released Tangle vocabulary editions and saved count/medal semantics. New accepted vocabularies need an explicit edition decision; the old target/count contracts must not be silently recomputed.

## Reproduce locally

- `python3 output/MAKER-Codex__esdb-research-20261101/MAKER-Codex__compare.py`
- `node output/MAKER-Codex__esdb-research-20261101/MAKER-Codex__verify.mjs`

These comparisons are offline and execute only authored local parsers. The two fetch scripts preserve official upstream metadata and fixed-commit data; they are not required for reproducing the retained-file comparison.
