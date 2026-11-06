# SEO Audit — Landing Page (`/`)

**Scope:** `app/(main)/page.tsx` (route `/`) plus the metadata/layout machinery that shapes it.
**Repo:** `E:\Coding\School Project\school_saas` @ `980162d` (main)
**Method:** source inspection + real HTTP fetches against `localhost:3000` (dev server running). No production build, no Search Console data.
**Date:** 2026-11-06
**Changes made:** none — read-only audit.

---

## 0. What is already correct

| Item | Evidence |
|---|---|
| Server-rendered content | 385 words of visible text present in raw `curl` HTML — no JS needed |
| Single `<h1>` | `curl /` → exactly one `<h1>`; order `h1 → h2 → h3×6 → h2 → h3×3 → h2 → h2` (no skipped levels) |
| `<html lang>` set | `lang="en"` rendered |
| `<meta name="viewport">` | present, `width=device-width, initial-scale=1`, no `maximum-scale` anti-pattern |
| Favicon | `app/favicon.ico` served, `<link rel="icon" sizes="256x256">` |
| Landing is indexable | no `noindex` on `/` |
| Private routes gated | `/dashboard` → `307`; `proxy.ts` matcher covers `/dashboard`, `/super-admin`, `/print` |
| Real 404 status | `/nonexistent-xyz-abc` → `404` (not a soft 200) |

---

## 1. Confirmed issues

### CRIT-1 — Landing page has no metadata of its own
- **File:** `app/(main)/page.tsx` — no `export const metadata`, no `generateMetadata`.
- **Evidence:** rendered head is only the root-layout default:
  - `<title>Educare — School Management</title>`
  - `<meta name="description" content="School management for Bangladeshi schools — students, classes, exams and published results in one place.">`
  - `app/layout.tsx:41-48` is the only non-print metadata declaration in the repo.
- **Impact:** title carries no search intent ("school management system", "Bangladesh", "software"). Google shows a generic brand title for commercial queries → lower CTR and weaker topical relevance for the only page that can rank.
- **Fix:** add `export const metadata: Metadata` to `app/(main)/page.tsx` with a title (~55-60 chars) and description (~150-155 chars) targeting the primary query. The `%s · Educare` template in the root layout is currently unused by any page.

### CRIT-2 — Identical title + description on 4 public URLs
- **Evidence (each fetched individually):**

  | URL | `<title>` | description |
  |---|---|---|
  | `/` | Educare — School Management | shared |
  | `/auth/login` | Educare — School Management | shared |
  | `/auth/onboarding/signup` | Educare — School Management | shared |
  | `/unauthorize` | Educare — School Management | shared |

- **Cause:** only `app/layout.tsx` and `app/print/layout.tsx` declare metadata; every other public page inherits it verbatim.
- **Impact:** duplicate titles/descriptions across indexable URLs; login and error pages compete with the marketing page for the same snippet.
- **Fix:** unique metadata per public page; `robots: { index: false }` on `/auth/*` and `/unauthorize`.

### CRIT-3 — No canonical URLs anywhere, no `metadataBase`
- **Evidence:** grep for `canonical|alternates|metadataBase` across `app/`, `components/`, `src/` → **0 hits**. Rendered HTML has no `<link rel="canonical">`.
- **Evidence:** `/?utm_source=test` → `200`, same content, distinct URL, no consolidation signal.
- **Impact:** every campaign/parameter variant is treated as a separate URL with no canonical hint.
- **Fix:** set `metadataBase` in `app/layout.tsx` from the app URL env var (`NEXT_PUBLIC_BETTER_AUTH_URL` is already defined in `.env`), and `alternates: { canonical: "/" }` on the landing page.

### HIGH-1 — `/robots.txt` and `/sitemap.xml` both 404
- **Evidence:** `curl -o /dev/null -w %{http_code}` → `robots:404`, `sitemap:404`, `manifest:404`.
- **Evidence:** no `app/robots.ts`, no `app/sitemap.ts`, no `public/robots.txt`, no `public/sitemap.xml`.
- **Impact:** no sitemap to submit or discover pages from; `/dashboard`, `/print`, `/super-admin`, `/api` are technically crawlable and burn crawl budget on 307s (`/dashboard` → 307 verified).
- **Fix:** add `app/robots.ts` (allow `/`, disallow `/dashboard`, `/super-admin`, `/print`, `/api`, point at the sitemap) and `app/sitemap.ts` listing the public URLs.

### HIGH-2 — Zero Open Graph / Twitter Card tags
- **Evidence:** 0 `og:*` properties in rendered HTML; grep for `openGraph|twitter:` → 0 hits.
- **Impact:** link shares (Facebook/Messenger/WhatsApp dominate the BD market) render with no title card, no image, no description — direct loss of click-through on the main acquisition channel.
- **Fix:** `openGraph` + `twitter` blocks in the landing metadata, plus a 1200×630 `opengraph-image`.

### HIGH-3 — ~195 KB of unused font preloads on `/`
- **Evidence:** `Link:` response header on `/` preloads 4 woff2 files; sizes from `.next/static/media` and family from the CSS chunks:

  | File | Family | Bytes | Utility class used on `/` |
  |---|---|---|---|
  | `83afe278b6a6bb3c` | Inter | 48,432 | `font-sans` ✓ (2 uses) |
  | `68d403cf9f2c68c5` | Source Serif 4 | 50,952 | `font-serif` — **0 uses** |
  | `70bc3e132a0a741e` | JetBrains Mono | 40,480 | `font-mono` — **0 uses** |
  | `6ea8d1bb8ea4af7a` | Noto Sans Bengali | 107,884 | `font-bangla` — **0 uses** |

- **Why:** all four are declared in `app/layout.tsx:18-39` with `preload` left at its default, so Next.js emits a high-priority `<link rel=preload as=font>` for each on every route — including a page that renders only English Inter text (`--font-heading: var(--font-sans)`, `globals.css:87`).
- **Impact:** 199,316 of 247,748 preloaded font bytes (80%) are dead weight competing with the stylesheet and the first paint → LCP regression, extra ~195 KB on mobile data for BD users.
- **Fix:** per-family — set `preload: false` on Source Serif 4, JetBrains Mono and Noto Sans Bengali in the root layout (they still load on demand where used), or move the dashboards' fonts into the `dashboard` segment layout so `/` never inherits them.

### MED-1 — No structured data at all
- **Evidence:** `grep -c "application/ld+json"` on rendered `/` → `0`; no JSON-LD component in the repo.
- **Impact:** no `Organization`, no `SoftwareApplication` (with `areaServed: BD`), no `FAQPage`, no `BreadcrumbList` → no rich-result eligibility and weaker entity association for "Educare" as a product.
- **Fix:** ship JSON-LD in the landing page from the existing copy (the 6 features and 3 steps already read like FAQ/product content — no new copy required).

### MED-2 — `/unauthorize` is an indexable soft-404
- **File:** `app/(main)/unauthorize/page.tsx`
- **Evidence:** returns `200`, public, no `robots` meta, ~2 sentences of content, inherits the marketing title/description. It is the redirect target of 12+ dashboard pages (`redirect("/unauthorize")`).
- **Impact:** a dead-end "Access Denied" page gets indexed as thin content.
- **Fix:** `robots: { index: false }` on the page (cheapest), or move it out of `(main)` and return a proper status.

### MED-3 — The 404 page emits two `<title>` elements
- **Evidence:** `curl /nonexistent-xyz-abc` head contains both:
  - `<title>Educare — School Management</title>`
  - `<title>404: This page could not be found.</title>`
- **Cause:** no `app/not-found.tsx` exists, so Next's default 404 is used *inside* the root layout, which also injects `title.default`.
- **Impact:** invalid document head; title selection becomes UA-dependent. The 404 also has no branding and no link back to `/`.
- **Fix:** add `app/not-found.tsx` with its own heading/copy and a link home; give it explicit metadata.

### MED-4 — `cookies()` in the root layout opts `/` out of static rendering
- **File:** `app/layout.tsx:55` → `getI18n()` → `src/i18n/server.ts` → `await cookies()`.
- **Evidence:** `Cache-Control: no-cache, must-revalidate` on `/` (dev header — not conclusive on its own).
- **Impact:** a marketing page that never differs per user cannot be statically prerendered or CDN-cached; every hit is a server render. TTFB for BD mobile users is the direct cost, and TTFB feeds LCP.
- **Assumption to verify:** confirm against a production build (route should show as static, `○`) before acting.
- **Fix (if confirmed):** read the locale only where it is actually needed (dashboard segment layout), or move the landing page's copy out of the cookie-dependent path.

### MED-5 — Language signals: cookie-driven `lang`, no hreflang, untranslated landing
- **Evidence:** `curl -H "Cookie: educare-locale=bn" /` → `<html lang="bn">` on a body that is still 100% English (`app/(main)/page.tsx` hardcodes English copy; no `t()` call). No `alternates.languages` anywhere.
- **Impact:** `lang` mismatches the content for Bangla-cookie visitors; the Bangla experience is invisible to crawlers; no hreflang pair exists even though a full `bn` dictionary ships in every page payload.
- **Fix:** drive `lang` from the rendered content, and if a Bangla landing is wanted, expose it at `/bn` with `hreflang` rather than a cookie.

### LOW-1 — Thin content for a commercial target
- **Evidence:** 385 visible words, one URL, 1 h1 / 4 h2 / 9 h3.
- **Impact:** unlikely to compete on "school management system Bangladesh" against sites with feature/pricing/content pages. Not a defect per se — a ceiling.

### LOW-2 — No images on the landing page; dead hero component
- **Evidence:** 0 `<img>` elements on `/`; no `og:image`.
- **Evidence:** `components/home/hero-section.tsx` is never imported (grep → only its own definition), and line 80 uses `src="/public/dashboard_mockup.webp"` — a broken path (the file is served at `/dashboard_mockup.webp`). Its alts are `"app screen"` and `"background"`.
- **Impact:** no visual proof for a visual product, no image-search surface, nothing to announce on social. The dead component is a latent bug if it is ever mounted.

### INFO-1 — Internal linking: 9 links, all to `/auth/*`
`/auth/onboarding/signup` ×5, `/auth/login` ×4, `#features` ×3, `#how` ×3, `#why` ×2, `/` ×1 (logo). Every link exits to auth; no page links to another indexable page because none exists. No About, Pricing, Contact or documentation → little E-E-A-T surface (no company identity, no contact, no author).

### INFO-2 — H1 omits the category and the brand
`<h1>Run the whole school / from one place.</h1>` — evocative, but contains no "school management" and no "Bangladesh". The descriptive line sits in the `<p>` below it.

---

## 2. Opportunities (not defects)

1. **Add 4–6 indexable pages** so the site is not a single-URL brochure: `/features`, `/pricing`, `/about`, `/contact`, and one or two guides (e.g. how GPA-5 grade bands work in Bangladesh, what an EIIN is). Each with unique metadata + canonical + internal links from `/`.
2. **Keyword targets** worth architecting around (intent-matched, no volume figures invented):
   - Primary: *school management system bangladesh*, *school management software bangladesh*
   - Secondary: *EIIN based school software*, *online exam result management software*, *Bangla school management software*, *GPA result software for schools*
3. **Bangla landing variant at `/bn`** with `hreflang` — the dictionary already exists, so this is a real international-SEO win in a Bangla-first market, and it is currently unreachable by crawlers.
4. **FAQPage schema** built from the existing feature/step copy.
5. **OG image** from the existing hero, 1200×630.
6. **Attribution-free of third-party noise:** none found — no tracking scripts, no external fonts. Good.

---

## 3. Assumptions / not verifiable here

- **No Search Console / Analytics access** → no index coverage, impressions, CTR or ranking data. None is reported or inferred in this document.
- **Production origin** unknown: `NEXT_PUBLIC_BETTER_AUTH_URL` exists in `.env` but was not read. Canonicals/OG/sitemap need that absolute origin.
- **Core Web Vitals not measured live** — the headless browser failed to start on this host, and dev-mode JS/font timing is not representative. Font byte counts above are exact file sizes, not estimates; LCP/INP/CLS still need a production Lighthouse run.
- **MED-4** (dynamic rendering) is inferred from documented Next.js behaviour of `cookies()` in a layout; confirm on a production build before fixing.

---

## 4. Suggested order of work

1. CRIT-1 + CRIT-2 + CRIT-3 — metadata on `/`, unique titles for the other 3 public URLs, `metadataBase` + canonical. One file each, highest ratio of impact to effort.
2. HIGH-1 — `app/robots.ts` + `app/sitemap.ts`.
3. HIGH-2 — OG/Twitter + `opengraph-image`.
4. HIGH-3 — `preload: false` on the three unused font families (measure LCP before/after).
5. MED-1 — JSON-LD (Organization + SoftwareApplication + FAQPage).
6. MED-2 + MED-3 — noindex `/unauthorize`; add `app/not-found.tsx`.
7. MED-4 / MED-5 — decide whether `/` becomes static and whether Bangla gets a real URL.
8. Content expansion (opportunities 1–3) — the only path to ranking beyond brand terms.
