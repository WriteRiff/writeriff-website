# Licenses: WriteRiff website

Everything on the site that came from somewhere else. Add a row in the same change that brings something in (shared rule, 2026-11-18). Each site version also has its own `IMAGE-CREDITS.md` with the same details.

## Shared by all three site versions (`site/_shared/`, copied into each version)

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| WriteRiff scribe logo animation (`assets/scribe-logo.js`) | Opening intro and header logo, every page | Copied byte-exact from the app (`assets/startup/writeriff-written-textfirst-light.json`); made for WriteRiff | Owned by Scott and Jana | (app repo) | Nothing |
| App icon (favicon, apple-touch-icon, icon-512, used in some share images) | Browser tab icon, share images | Resized from the app's `assets/images/icon.png` | Owned by Scott and Jana | (app repo) | Nothing |
| Account pages (`account-callback/`, `email/writeriff-mark.png`, `delete-account/`) | App email links, Google Play deletion page | From the app repo (`scripts/prepare-account-callback-host.cjs`, `web/delete-account/`) | Owned by Scott and Jana | (app repo) | Nothing; don't edit the callback page (script hash in its security policy) |
| lottie-web 5.13.0 (`assets/lottie_light.min.js`) | Plays the logo animation | Airbnb | MIT | https://github.com/airbnb/lottie-web | Keep the MIT notice (`assets/lottie-web-LICENSE.md` sits next to the file) |

## Outside services loaded by the live site

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| Cloudflare Web Analytics beacon (`beacon.min.js`, loaded from Cloudflare, not copied into the site) | Every page except account-callback | Cloudflare | Cloudflare's terms of service (free service) | https://www.cloudflare.com/web-analytics/ | Nothing beyond the service terms; mention it in the privacy policy (done by the app repo) |

## Version A (antique meets modern)

All photos: Unsplash, free Unsplash License (commercial use allowed, no credit required; none are Unsplash+). Resized, cropped, compressed to WebP.

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| typewriter-desk.webp (maker's name plate painted out) | Home hero, share image | Bernard Hermant | Unsplash License | https://unsplash.com/photos/qTpc0Vj4YoE | Nothing |
| old-books.webp | Home, Beta | Chris Lawton | Unsplash License | https://unsplash.com/photos/zvKx6ixUhWQ | Nothing |
| book-phone-laptop.webp (cropped) | Home, Features | Miom _0326 | Unsplash License | https://unsplash.com/photos/gUc6Oiw9m4s | Nothing |
| fountain-pen.webp | Home, Beta | Tony Chen | Unsplash License | https://unsplash.com/photos/lPAZ2mSA7zI | Nothing |
| pen-letter.webp | Home, Contact | Álvaro Serrano | Unsplash License | https://unsplash.com/photos/hjwKMkehBco | Nothing |
| typewriter-keys.webp (cropped to remove maker's name) | Beta | Camille Orgel | Unsplash License | https://unsplash.com/photos/SKcTKYNRvHY | Nothing |
| typewriter-white.webp | Features | Ashley Kirk | Unsplash License | https://unsplash.com/photos/HwL5Yn048FY | Nothing |
| Fraunces font (woff2) | Headings | Undercase Type, via Fontsource | SIL Open Font License 1.1 | https://github.com/undercasetype/Fraunces | Keep the licence file with the font (`assets/fonts/Fraunces-OFL.txt`) |
| Inter font (woff2) | Body text | Rasmus Andersson, via Fontsource | SIL Open Font License 1.1 | https://rsms.me/inter/ | Keep the licence file (`assets/fonts/Inter-OFL.txt`) |

## Versions A1–A4 (refinements of A, 2026-11-20)

A1–A4 use everything listed for Version A above, plus:

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| Paper fibre photo scan "Paper 006" (toned and made seamless; stains and spots added by us) → `paper-parchment.webp` (A2, A3), `paper-fibre.webp` (A4, A5) `parchment-corner-30.webp` (A5) and `parchment-corner-50.webp` (A6) | Page background textures | Lennart Demes / ambientCG | CC0 1.0 (public domain) | https://ambientcg.com/view?id=Paper006 | Nothing (no credit needed) |

## Version B (all modern)

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| devices-desk.webp | Home, "Anywhere" | Jakub Żerdzicki | Unsplash License | https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-white-desk-gNb1-SYL5G0 | Nothing |
| laptop-white.webp (cropped to hide maker's logo) | Features, Folio | Adrian Regeci | Unsplash License | https://unsplash.com/photos/a-close-up-of-a-laptop-on-a-white-surface-0FdUU3zlVlI | Nothing |
| phone-hand.webp | Features, Anywhere | Mediamodifier | Unsplash License | https://unsplash.com/photos/voRfgeyiBKA | Nothing |
| bright-studio.webp | Join the beta | ergonofis | Unsplash License | https://unsplash.com/photos/a-white-desk-with-a-laptop-on-top-of-it-hPCFOFtmNls | Nothing |
| phone-white.webp | Contact | NordWood Themes | Unsplash License | https://unsplash.com/photos/q8U1YgBaRQk | Nothing |
| Inter variable font (woff2) | All text | Rasmus Andersson, via Fontsource | SIL Open Font License 1.1 | https://rsms.me/inter/ | Keep the licence file (`fonts/Inter-OFL-LICENSE.txt`) |

## Version C (from spark to story)

No photos: every illustration is original SVG/CSS made for this site.

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| Fraunces font (woff2) | Headlines, "handwritten" notes, share image | Undercase Type, via Fontsource | SIL Open Font License 1.1 | https://github.com/undercasetype/Fraunces | Keep the licence file (`assets/fonts/fraunces-LICENSE.txt`) |
| Figtree font (woff2) | Body text | Erik Kennedy, via Fontsource | SIL Open Font License 1.1 | https://github.com/erikdkennedy/figtree | Keep the licence file (`assets/fonts/figtree-LICENSE.txt`) |

## Opening video prototype (on hold, not used in the site versions)

| What | Where it's used | Source / author | License | Link | What we must do |
|---|---|---|---|---|---|
| Intro video (`video 1.mp4`, retimed to `intro.mp4` / `intro.webm`, poster and still frames) | `prototypes/opening/` only | AI-generated on fal.ai with MiniMax H3, paid account (made 2026-10-07) | Commercial use allowed per fal's MiniMax H3 page; fal claims no rights in outputs | https://fal.ai/minimax-h3 | No credit required |

Fonts: the opening prototype uses the visitor's own system font.

## Build-only tools (not shipped)

| What | Used for | License | Link |
|---|---|---|---|
| FFmpeg (via the `imageio-ffmpeg` Python package) | Retiming and compressing the intro video (prototype) | LGPL/GPL (tool only; nothing of it ships) | https://ffmpeg.org |
| NumPy, Pillow | Video frames (prototype); resizing photos, making favicons and share images | BSD / MIT-CMU | https://numpy.org, https://python-pillow.org |
| Playwright (Python) with Microsoft Edge | Headless checks and screenshots (`site/_tools/`) | Apache-2.0 | https://playwright.dev |
| GitHub Actions `actions/checkout@v4` | Downtime alarm and monthly report workflows (nothing required) | MIT | https://github.com/actions/checkout/tree/v4 |
