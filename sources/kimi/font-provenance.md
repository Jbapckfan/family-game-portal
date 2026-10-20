# Kimi package: font provenance and restored license notices

Verified on 2026-10-20 against the preserved user-supplied archive, the adapted font binaries, and the font projects' official repositories. This record concerns only the eight bundled font files. It does not establish the source dictionary's origin or license.

## Preserved source and verification method

The source archive is `sources/kimi/original/Kimi_Agent_iOS_4-Game_Monetization.zip`, SHA-256 `fa7f26863aef94f3fc85131e587312c1ddafcf0fd2f9f053095d4b7b2a8a9c17`. Every adapted font under `packages/kimi-pebbles/public/fonts/` is byte-for-byte identical to its `app/public/fonts/` entry in that ZIP. The archive was not modified. All 144 original file records in `sources/kimi/provenance.json` were independently checked against the archive by path, size, and SHA-256.

Metadata was read directly from each WOFF2 binary using FontTools' `TTFont`, with Node's built-in Brotli decompressor supplying the WOFF2 decompression step. Inspected fields were OpenType name IDs 0 (copyright), 1 (family), 2 (style), 5 (version), 6 (PostScript name), 13 (license text), and 14 (license URL), plus `OS/2.usWeightClass`. No font installation, font conversion, or binary rewrite was performed. All eight fonts are static fonts, and their OS/2 weight values match their filename weights.

## Official notices added

The two complete upstream OFL notices are preserved without byte changes, including the Baloo 2 notice's UTF-8 byte-order mark. The Git blob SHA-1 of each saved notice matches the SHA returned by GitHub's read-only contents API. Both notices contain the full SIL Open Font License 1.1, including its copyright header, conditions, termination clause, and disclaimer.

### Baloo 2

- Bundled files: `baloo2-500.woff2`, `baloo2-600.woff2`, `baloo2-700.woff2`, and `baloo2-800.woff2`.
- Embedded copyright in all four: `Copyright 2019 The Baloo 2 Project Authors (https://github.com/EkType/Baloo2)`.
- Embedded license URL in all four: `http://scripts.sil.org/OFL`.
- Embedded version in all four: `Version 1.700`.
- Official repository associated with the embedded copyright: <https://github.com/EkType/Baloo2>.
- Exact notice retrieved: <https://github.com/EkType/Baloo2-Variable/blob/master/OFL.txt>.
- GitHub read endpoint used: <https://api.github.com/repos/EkType/Baloo2-Variable/contents/OFL.txt?ref=master>.
- Saved notice: `packages/kimi-pebbles/public/fonts/Baloo2-LICENSE.txt`.
- Size: 4,384 bytes.
- Git blob SHA-1: `72adb492d4f0ede2a9dbdefed607f33ad3a6fc68`.
- SHA-256: `ad09b05dc8bc678c9daf7c4c5f7ef1f55e5726127f4330b2e98e40b9dffcb860`.

EkType's main Baloo2 repository currently has a differently worded copyright header, `Copyright (c) 2019 Ek Type (www.ektype.in)`, in <https://github.com/EkType/Baloo2/blob/master/OFL.txt>. The notice from EkType's official Baloo2-Variable repository was selected because its copyright line exactly matches the embedded copyright in all four supplied files. This identifies the matching license notice; it does not assert that the supplied static WOFF2 files were downloaded directly from that variable-font repository.

### Nunito

- Bundled files: `nunito-400.woff2`, `nunito-600.woff2`, `nunito-700.woff2`, and `nunito-800.woff2`.
- Embedded copyright in all four: `Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)`.
- Embedded license URL in all four: `https://scripts.sil.org/OFL`.
- Embedded version in all four: `Version 3.602`.
- Official repository and exact notice retrieved: <https://github.com/googlefonts/nunito/blob/main/OFL.txt>.
- GitHub read endpoint used: <https://api.github.com/repos/googlefonts/nunito/contents/OFL.txt?ref=main>.
- Saved notice: `packages/kimi-pebbles/public/fonts/Nunito-LICENSE.txt`.
- Size: 4,385 bytes.
- Git blob SHA-1: `c8210f08ca3cece05b4f7baa428afe8e1abe3293`.
- SHA-256: `580df76c95a1ec5ab878ceb25bb3d85c6a076804e9c970c8c6972aea775fdf65`.

The official Nunito notice's copyright line exactly matches all four supplied files. Its notice links to the HTTP form of the same OFL URL; the bundled binaries use HTTPS. This is an existing URL-scheme difference, not a different license version.

## Binary inventory

All rows below passed the original-ZIP byte comparison. Weights are the verified `OS/2.usWeightClass` values.

| File | Font version | Weight | Bytes | SHA-256 |
|---|---:|---:|---:|---|
| `baloo2-500.woff2` | 1.700 | 500 | 19,556 | `b533661a076cc6e6ecd387f4665a02e923f94eec48bfe5bcecaf29213eb29a36` |
| `baloo2-600.woff2` | 1.700 | 600 | 19,496 | `ffc22b431dcb01372be1986bc472bd400bbcb56b712a863c3abec7f8302e1bdd` |
| `baloo2-700.woff2` | 1.700 | 700 | 19,436 | `8e7ffc9b993aa8caa89bcab81e103c9eb2da4e3e042f37b7a5115d0ddbff12c0` |
| `baloo2-800.woff2` | 1.700 | 800 | 18,632 | `3e36c57e37bda5b5f28cf10636d6d3aed4de5250df923f1b203b64ad857c79a7` |
| `nunito-400.woff2` | 3.602 | 400 | 16,316 | `a5906e15ceb68f73d3b2c2076b4057c3f6ed401186d56283b45ce12944ca0735` |
| `nunito-600.woff2` | 3.602 | 600 | 16,556 | `45f437de32ff5973eb5616b43c1308bf9fe897442f3d78a603c4cd0a06d66573` |
| `nunito-700.woff2` | 3.602 | 700 | 16,228 | `fa89300b9bbb3bd0f60d6991aa055965d98e2ccca27bf8688fe0c39cdc796846` |
| `nunito-800.woff2` | 3.602 | 800 | 16,520 | `2363d3ed037283ebb961e8c4b4917e40a8bc8853cf9965cf1ea7b4daa1df630a` |

The Baloo 2 PostScript names are `Baloo2-Medium`, `Baloo2-SemiBold`, `Baloo2-Bold`, and `Baloo2-ExtraBold`. Nunito's supplied binaries use `NunitoExtraLight-Regular`, `NunitoExtraLight-SemiBold`, `NunitoExtraLight-Bold`, and `NunitoExtraLight-ExtraBold`. The inherited “ExtraLight” family wording in Nunito does not match the filename's family wording, but the numerical weight fields are 400, 600, 700, and 800 as advertised. This metadata was preserved. None of the eight files includes a full name-ID-13 license-text record; all include the name-ID-14 license URL.

## Scope and distribution record

The original upload omitted standalone font-license files. The adapted package now supplies the matching copyright notices and complete OFL 1.1 text. Keep these notices with the fonts when staging the web runtime at `games/kimi-runtime/fonts/` and its iOS bundle copy. Preserve the full license terms when redistributing the fonts; the license permits software bundling subject to its conditions.

The exact original download URLs and any earlier subsetting or static-instance generation were not supplied, and have not been inferred. The font bytes remain those received from the user. No font source authorship is assigned to Kimi or ChatGPT: Kimi is the credited developer of the supplied games, and the font projects retain their own copyright notices. The shared dictionary's origin and distribution permissions remain unresolved.
