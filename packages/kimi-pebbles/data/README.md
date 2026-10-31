# Full-length English word source

`english-words-alpha.txt` is the unmodified `words_alpha.txt` from [dwyl/english-words](https://github.com/dwyl/english-words/tree/20f5cc9b3f0ccc8ce45d814c532b7c2031bba31c), revision `20f5cc9b3f0ccc8ce45d814c532b7c2031bba31c`, retrieved October 31, 2026. The accompanying source receipt records byte counts and SHA-256 hashes. Its supplied [license](english-words-LICENSE.md) is retained.

The existing Cairn dictionary contains 97,109 entries of three through seven letters, all present in this 370,105-entry source. This full-length source is used at generation/test time for the optional Tangle 5×5 sample, including longer words and inflections. The browser receives only the precomputed words with valid paths on that board. It does not download this file or call a dictionary service.

Regenerate from the repository root with `node scripts/generate-tangle-five-preview.mjs`. The existing closed Tangle exclusion policy is retained. Independent tests compare the resulting accepted set against every source entry with a valid eight-way path and no reused cell. Source membership is the acceptance rule; it does not establish familiarity, modern usage or completeness of English. The original four-wide bank and other games' dictionaries are unchanged.
