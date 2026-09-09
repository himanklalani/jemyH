# JEMY - Production Deployment Changelog & Architectural Decisions

This document details the complete operational, architectural, and code-level decisions implemented for the production deployment of the **JEMY Optical Precision & Luxury E-Commerce Ecosystem** on Vercel.

Every section below provides the **Decision Made**, the **Technical & Business Rationale ("Why")**, the **Exact Code & Infrastructure Changes ("What Changed")**, and direct reciprocal cross-references to the master architecture document: [`context.md`](file:///d:/jemy/context.md).

---

## Quick Reference Cross-Walk

| Deployment Decision / Topic | Changelog Section | Corresponding `context.md` Anchor |
|---|---|---|
| Serverless Next.js 16.3 Architecture | [1. Hosting & Infrastructure Topology](#1-hosting--infrastructure-topology-decisions) | [1. System Architecture & Tech Stack](file:///d:/jemy/context.md#1-system-architecture--tech-stack) |
| MongoDB Atlas Connection Pool Caching | [2. Database Connection Management](#2-database-connection-management-mongodb-atlas) | [3. Data Models & Schemas](file:///d:/jemy/context.md#3-data-models--schemas) & [8.4 Mongoose Discriminators](file:///d:/jemy/context.md#84-mongoose-discriminators) |
| Upstash Redis REST Rate Limiting | [3. Distributed Serverless Rate Limiting](#3-distributed-serverless-rate-limiting-upstash-redis) | [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map) & [12. Production Deployment](file:///d:/jemy/context.md#12-production-deployment--operational-changelog) |
| Cloudinary Media Delivery Network | [4. Media Optimization & CDN Pipeline](#4-media-optimization--cdn-pipeline-cloudinary) | [3.1 Product Schema](file:///d:/jemy/context.md#31-product-schema-srcmodelsproductts) & [6.6 Micro-Animations](file:///d:/jemy/context.md#66-micro-animations--component-locations) |
| Brevo Transactional Email Integration | [5. Transactional Communication Service](#5-transactional-communication-service-brevo) | [3.2 Prescription Schema](file:///d:/jemy/context.md#32-prescription-schema-srcmodelsprescriptionts) & [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map) |
| Admin Frontend Route Lockdown | [6. Admin Portal Route Lockdown & Stealth Access](#6-admin-portal-route-lockdown--stealth-access) | [5. Admin Operations Hub & Responsive Dashboard](file:///d:/jemy/context.md#5-admin-operations-hub--responsive-dashboard) |
| Live Infrastructure Healthcheck | [7. Deep Healthcheck & Diagnostics Endpoint](#7-deep-healthcheck--diagnostics-endpoint) | [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map) |
| Panchang Display Font FOUT Elimination | [8. Typography Optimization & FOUT Prevention](#8-typography-optimization--fout-prevention) | [6.2 Preloader & Cinematic Timing](file:///d:/jemy/context.md#62-preloader--cinematic-timing-preloaderts) & [8.1 Complex Animations](file:///d:/jemy/context.md#81-complex-animations--where-to-find-them) |
| Typographic Section Heading Regex | [9. Section Heading Typographic Line Splitting](#9-section-heading-typographic-line-splitting) | [6. Animations & Motion System](file:///d:/jemy/context.md#6-animations--motion-system-deep-dive) & [9. Homepage Render Order](file:///d:/jemy/context.md#9-homepage-section-render-order-srcapppagetsx-line-812) |
| Parallax Advertisement Scroll Stack | [10. Editorial Scroll Stack Media Restoration](#10-editorial-scroll-stack-media-restoration) | [9. Homepage Render Order (#7)](file:///d:/jemy/context.md#9-homepage-section-render-order-srcapppagetsx-line-812) |
| Secret Sanitization & Font Repo Pruning | [11. Repository Hygiene & Secret Sanitization](#11-repository-hygiene--secret-sanitization) | [7. Key Code Files Index](file:///d:/jemy/context.md#7-key-code-files-index) & [8. Logic Locations](file:///d:/jemy/context.md#8-logic-systems-and-animation-locations-for-next-agent) |
| Production Environment Matrix | [12. Production Environment Variable Matrix](#12-production-environment-variable-matrix) | [12. Production Deployment](file:///d:/jemy/context.md#12-production-deployment--operational-changelog) |

---

## 1. Hosting & Infrastructure Topology Decisions

> 🔗 **Corresponding `context.md` Section**: [1. System Architecture & Tech Stack](file:///d:/jemy/context.md#1-system-architecture--tech-stack) and [2. System Architecture Diagram](file:///d:/jemy/context.md#2-system-architecture-diagram)

### Decision
Deploy the entire application as a unified, full-stack Next.js 16.3 (Turbopack + App Router) instance on **Vercel Serverless Functions**, co-locating the storefront React Server Components (RSC) and backend API Route Handlers (`src/app/api/*`) in the same deploy unit.

### Why We Made This Decision
1. **Eliminated Separate Backend Infrastructure Overhead**: By avoiding a detached Node.js/Express service (e.g., on Render or AWS EC2), we eradicated cross-origin CORS negotiation, cookie synchronization issues, separate SSL certificates, and dual CI/CD pipelines.
2. **Edge Network Co-Location**: Next.js App Router allows static catalog pages and visual assets to be cached across Vercel's global CDN Edge, while dynamic routes (such as checkout and cart calculations) execute on serverless lambdas with minimal latency.
3. **Single TypeScript Contract**: Frontend UI components and backend route handlers share the exact same Mongoose schemas, TypeScript interfaces, and validation utilities without needing a monorepo package orchestrator.

### What Was Changed
- Configured project root for Next.js 16.3 on Vercel (`next.config.ts`).
- Consolidated all transactional API endpoints under `src/app/api/` (refer to the [API Route Map in context.md Section 10](file:///d:/jemy/context.md#10-full-api-route-map)).
- Established Turbopack-compatible build configs and removed deprecated webpack-only plugins.

---

## 2. Database Connection Management (MongoDB Atlas)

> 🔗 **Corresponding `context.md` Section**: [3. Data Models & Schemas](file:///d:/jemy/context.md#3-data-models--schemas) and [8.4 Mongoose Discriminators](file:///d:/jemy/context.md#84-mongoose-discriminators)

### Decision
Connect to a dedicated MongoDB Atlas cluster using a global cached connection singleton (`src/lib/mongoose.ts`) rather than establishing a new connection per HTTP request.

### Why We Made This Decision
1. **Prevent Connection Pool Starvation**: In a serverless architecture (Vercel Lambdas), incoming requests spin up isolated execution contexts. Without connection caching, each incoming API call initiates a new TCP connection to MongoDB Atlas, quickly exceeding MongoDB's maximum connection pool limit (e.g., 500 connections on Atlas M0/M20) and triggering `MongoNetworkTimeoutError`.
2. **Zero Hot-Reload Collision**: Development and serverless warm re-invocations can re-evaluate schema files, causing Mongoose `OverwriteModelError`.

### What Was Changed
- Modified [`src/lib/mongoose.ts`](file:///d:/jemy/src/lib/mongoose.ts) to define a persistent NodeJS global reference `global.mongoose = { conn: null, promise: null }`.
- Implemented connection caching options (`bufferCommands: false`, `maxPoolSize: 10`).
- Implemented discriminator getter wrappers in [`src/models/Product.ts`](file:///d:/jemy/src/models/Product.ts) (`getEyewearProduct()`, `getSunglassesProduct()`) as detailed in [context.md Section 8.4](file:///d:/jemy/context.md#84-mongoose-discriminators).

---

## 3. Distributed Serverless Rate Limiting (Upstash Redis)

> 🔗 **Corresponding `context.md` Section**: [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map) and [12. Production Deployment](file:///d:/jemy/context.md#12-production-deployment--operational-changelog)

### Decision
Implement serverless-compatible sliding window rate limiters via **Upstash Redis REST API** (`@upstash/redis` and `@upstash/ratelimit`) across critical attack-surface endpoints.

### Why We Made This Decision
1. **In-Memory Rate Limiters Fail in Serverless**: Standard in-memory rate limiting libraries (e.g., `express-rate-limit`) only protect a single Node process. Since Vercel routes requests to disparate stateless lambdas, in-memory state is isolated and easily bypassed.
2. **Stateless HTTP REST Client**: Traditional Redis clients (e.g., `ioredis`) require persistent TCP socket pools that hang or exhaust sockets during serverless lifecycle freeze/thaw cycles. Upstash communicates over stateless HTTPS REST, making it natively serverless-resilient.
3. **Targeted Attack Prevention**:
   - **Auth Routes (`/api/auth/*`)**: Capped at **10 requests per 10 minutes** per IP to eliminate credential stuffing and brute-force attacks.
   - **OTP Requests**: Capped at **3 requests per 10 minutes** to prevent SMS/email toll fraud.
   - **Coupon Validation**: Capped at **20 requests per minute** to stop algorithmic coupon dictionary harvesting.

### What Was Changed
- Implemented [`src/lib/rateLimit.ts`](file:///d:/jemy/src/lib/rateLimit.ts):
  - Added lazy-initialized Upstash client instance.
  - Configured `Ratelimit.slidingWindow` for `auth`, `otp`, and `coupon` prefixes.
  - Added graceful fallback: if Redis credentials are intentionally omitted during local offline development, the limiter emits a single warning and allows the request through without throwing 500 errors.
  - Returned standard RFC rate limiting response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

---

## 4. Media Optimization & CDN Pipeline (Cloudinary)

> 🔗 **Corresponding `context.md` Section**: [3.1 Product Schema](file:///d:/jemy/context.md#31-product-schema-srcmodelsproductts) and [6.6 Micro-Animations & Component Locations](file:///d:/jemy/context.md#66-micro-animations--component-locations)

### Decision
Offload all luxury product imagery, prescription file attachments, lifestyle editorial photos, and brand media to **Cloudinary** backed by global multi-CDN caching.

### Why We Made This Decision
1. **Core Web Vitals & Bandwidth Protection**: The Jemy visual aesthetic relies on ultra-high-definition optical photography (2MB–8MB per image). Serving these directly from the Next.js server bundle or public folder consumes gigabytes of Vercel bandwidth quotas and catastrophically degrades Largest Contentful Paint (LCP).
2. **Dynamic Format & Dimension Auto-Tuning**: Cloudinary dynamically formats assets (`f_auto, q_auto`) into next-generation AVIF and WebP formats tailored to the client's browser capability and viewport density.
3. **Prescription Document Privacy**: Prescription uploads (OD/OS medical scans, PDFs) are isolated into dedicated Cloudinary storage buckets with administrative audit logging.

### What Was Changed
- Integrated [`src/lib/cloudinary.ts`](file:///d:/jemy/src/lib/cloudinary.ts) helper utility to sign uploads, process image transformations, and return secure HTTPS asset URLs.
- Replaced local hardcoded asset paths with CDN-ready references across product schemas ([`src/models/Product.ts`](file:///d:/jemy/src/models/Product.ts)).

---

## 5. Transactional Communication Service (Brevo)

> 🔗 **Corresponding `context.md` Section**: [3.2 Prescription Schema](file:///d:/jemy/context.md#32-prescription-schema-srcmodelsprescriptionts) and [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map)

### Decision
Integrate **Brevo (formerly Sendinblue)** via their official REST API (`@getbrevo/brevo`) for transactional e-commerce notifications.

### Why We Made This Decision
1. **Serverless Port 25/587 Throttling**: Standard SMTP sockets are routinely blocked or throttled by serverless hosting providers (including Vercel and AWS Lambda). Using an HTTPS REST API ensures 100% reliable execution.
2. **Dedicated Optical Order Notifications**: Customers receive automated transactional emails for order creation, payment receipts, optical prescription verification status updates (`verified` / `rejected`), and RMA return labels.

### What Was Changed
- Built [`src/lib/brevo.ts`](file:///d:/jemy/src/lib/brevo.ts) utility to dispatch transactional HTML templates for:
  - `sendOrderConfirmationEmail()`
  - `sendPrescriptionStatusEmail()`
  - `sendPasswordResetEmail()`

---

## 6. Admin Portal Route Lockdown & Stealth Access

> 🔗 **Corresponding `context.md` Section**: [5. Admin Operations Hub & Responsive Dashboard](file:///d:/jemy/context.md#5-admin-operations-hub--responsive-dashboard) (Section 5.1)

### Decision
Implement a zero-leak client-side route guard (`AdminAuthGuard.tsx`) that wraps the administrative layout, combined with stealth navigation triggers on the storefront.

### Why We Made This Decision
1. **Eliminated Flashing Admin Chrome on Direct URL Navigation**: Previously, an unauthenticated user typing `/admin` in the browser URL would briefly observe the administrative sidebar, telemetry cards, or header before being redirected, presenting a serious UI security leak.
2. **Stealth Security Posture**: Public shoppers should not see administrative buttons, links, or pathways in the storefront navigation. The entry point should be invisible unless an administrative session is already active.

### What Was Changed
- **Created `AdminAuthGuard.tsx`**:
  - Implemented [`src/components/admin/AdminAuthGuard.tsx`](file:///d:/jemy/src/components/admin/AdminAuthGuard.tsx) which inspects `localStorage.getItem('adminToken')`.
  - While validating, it renders an opaque blank view using the admin background variable `var(--color-admin-bg)` to prevent any visual hydration flash.
  - If no token exists and the pathname is not `/admin/login`, it executes an immediate `router.replace('/')` bounce.
- **Wrapped Admin Layout**:
  - Updated [`src/app/admin/layout.tsx`](file:///d:/jemy/src/app/admin/layout.tsx) to wrap all children in `<AdminAuthGuard>`.
- **Stealth Navbar Access**:
  - Modified [`src/components/layout/Navbar.tsx`](file:///d:/jemy/src/components/layout/Navbar.tsx) to read `adminToken` on mount; only if an active admin session is present does the sleek "Admin" pill button render next to the menu toggle.

---

## 7. Deep Healthcheck & Diagnostics Endpoint

> 🔗 **Corresponding `context.md` Section**: [10. Full API Route Map](file:///d:/jemy/context.md#10-full-api-route-map)

### Decision
Upgrade `/api/healthcheck` from a shallow status responder into a full synthetic dependency verification probe.

### Why We Made This Decision
1. **Third-Party Uptime & Deployment Verification**: Uptime monitoring services (BetterUptime, Datadog, Vercel Health) require an endpoint that actually validates database responsiveness and caching layers rather than merely confirming that the web server can return `{ status: "ok" }`.
2. **Live Latency & Degradation Telemetry**: Immediate feedback on response times (in milliseconds) and individual service states (`database: "connected"`, `redis: "connected" | "skipped"`).

### What Was Changed
- Upgraded [`src/app/api/healthcheck/route.ts`](file:///d:/jemy/src/app/api/healthcheck/route.ts):
  - Tests live Mongoose connection ready state (`mongoose.connection.readyState === 1`).
  - Issues live `redis.ping()` to Upstash Redis (if configured).
  - Returns HTTP `200 OK` if dependencies are healthy, or HTTP `503 Service Unavailable` if database connectivity is severed.
  - Measures total execution duration in `responseTimeMs`.

---

## 8. Typography Optimization & FOUT Prevention

> 🔗 **Corresponding `context.md` Section**: [6.2 Preloader & Cinematic Timing](file:///d:/jemy/context.md#62-preloader--cinematic-timing-preloaderts) and [8.1 Complex Animations & Where to Find Them](file:///d:/jemy/context.md#81-complex-animations--where-to-find-them)

### Decision
Switch the primary luxury display font (**Panchang**) `@font-face` declaration from `font-display: swap` to `font-display: block`.

### Why We Made This Decision
1. **Eliminated Flash of Unstyled Text (FOUT)**: Under `font-display: swap`, system sans-serif fallback fonts would render momentarily while Panchang loaded over the network. In an industrial luxury storefront, this caused jarring visual shifts, horizontal layout jumps, and broken character tracking on large clamp headings (`clamp(3rem, 10vw, 8rem)`).
2. **Flawless Sync with 3.1-Second Preloader**: The application already features a branded, cinematic shutter preloader (`Preloader.tsx`) that masks the viewport for **3.1 seconds** on initial visit. With `font-display: block`, the browser briefly waits for the local WOFF2 font to load behind the opaque preloader mask, guaranteeing that when the preloader lifts, Panchang renders with pixel-perfect geometry.

### What Was Changed
- Modified [`src/app/globals.css`](file:///d:/jemy/src/app/globals.css):
  ```css
  @font-face {
    font-family: 'Panchang';
    src: url('/fonts/Panchang-Semibold.woff2') format('woff2');
    font-weight: 400 900;
    font-display: block; /* Switched from 'swap' to 'block' to eliminate FOUT */
    font-style: normal;
  }
  ```

---

## 9. Section Heading Typographic Line Splitting

> 🔗 **Corresponding `context.md` Section**: [6. Animations & Motion System](file:///d:/jemy/context.md#6-animations--motion-system-deep-dive) and [9. Homepage Section Render Order](file:///d:/jemy/context.md#9-homepage-section-render-order-srcapppagetsx-line-812)

### Decision
Upgrade the line-splitting algorithm in `SectionHeading` (`HomePageClient.tsx`) to support compound delimiters (escaped `\n`, native newline, and pipe `|`).

### Why We Made This Decision
1. **Broken Typographic Hierarchy**: When section titles were passed into components via props (e.g., `title="Sun\nCollection"` or `title="Architectural\nTitanium"`), JavaScript string handling occasionally retained the literal backslash and `'n'` characters instead of splitting into distinct typographic lines.
2. **Animation Continuity**: The GSAP/IntersectionObserver character reveal animation requires precise line arrays so that character indexes stagger sequentially without breaking the visual cadence.

### What Was Changed
- Updated [`src/components/home/HomePageClient.tsx`](file:///d:/jemy/src/components/home/HomePageClient.tsx):
  ```tsx
  // Allow splitting by actual newline, literal '\n', or pipe '|'
  const lines = title.split(/\\n|\n|\|/);
  ```

---

## 10. Editorial Scroll Stack Media Restoration

> 🔗 **Corresponding `context.md` Section**: [9. Homepage Section Render Order (#7)](file:///d:/jemy/context.md#9-homepage-section-render-order-srcapppagetsx-line-812)

### Decision
Repair broken fallback image paths in `AdvertisementScrollStack.tsx` and expand the default editorial campaign deck from 2 to 3 high-resolution cards.

### Why We Made This Decision
1. **Eliminated Broken Image Placards**: The fallback slides in `AdvertisementScrollStack.tsx` previously referenced outdated filenames (`editorial_1_1787494326577.jpg` and `editorial_3_1787494364240.jpg`), which threw 404 image errors in production when merchandising CMS records were empty.
2. **Visual Rhythm & Depth**: The native CSS `position: sticky` stacking deck requires at least three sequential cards to deliver the intended parallax depth perception as the user scrolls down the page.

### What Was Changed
- Modified [`src/components/ui/AdvertisementScrollStack.tsx`](file:///d:/jemy/src/components/ui/AdvertisementScrollStack.tsx):
  - **Slide 1**: `src: '/images/lookbook_1.png'` (Vol 1 - The Vanguard Collection)
  - **Slide 2**: `src: '/images/titanium_lifestyle_1_1787494228901.png'` (Vol 2 - Titanium Architecture)
  - **Slide 3**: `src: '/images/sun_lifestyle_1_1787494277969.png'` (Vol 3 - Sun Polarized Edition)

---

## 11. Repository Hygiene & Secret Sanitization

> 🔗 **Corresponding `context.md` Section**: [7. Key Code Files Index](file:///d:/jemy/context.md#7-key-code-files-index) and [8. Logic Locations](file:///d:/jemy/context.md#8-logic-systems-and-animation-locations-for-next-agent)

### Decision
Untrack one-off database migration scripts, local seeding files, and raw multi-megabyte desktop font archives from Git tracking prior to production deployment.

### Why We Made This Decision
1. **Secret & Endpoint Exposure Prevention**: Seeding scripts (`seed-new-products.ts`, `fix-images.ts`, `scripts/seedAdmin.ts`) contained development database assumptions, hardcoded administrative defaults, and local connection strings that should never exist in the production Git history.
2. **Build Acceleration & Slug Size Limits**: Uncompressed desktop font packages (`/Boxing_Complete`, `/ClashDisplay_Complete`, `/FontshareKit-*` containing `.otf`, `.ttf`, and `.eot` formats totaling tens of megabytes) caused repository bloat. Production only serves web-optimized `.woff2` files located in `/public/fonts/`.

### What Was Changed
- Updated [`.gitignore`](file:///d:/jemy/.gitignore) to exclude:
  - Raw font archives (`/Boxing_Complete`, `/ClashDisplay_Complete`, `/FontshareKit-*`).
  - Ad-hoc database seeding utilities (`fix-images.ts`, `seed-new-products.ts`, `update_published.js`, `/scripts/`).
  - Internal AI agent scratchpads (`.agents/`, `AGENTS.md`, `CLAUDE.md`).
- Executed `git rm --cached` on untracked assets to keep the production bundle clean.

---

## 12. Production Environment Variable Matrix

> 🔗 **Corresponding `context.md` Section**: [12. Production Deployment & Operational Changelog](file:///d:/jemy/context.md#12-production-deployment--operational-changelog)

Configure the following environment variables in the **Vercel Project Settings > Environment Variables** dashboard before triggering the production build:

| Variable Name | Required | Service Provider | Description / Purpose |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | MongoDB Atlas | Connection string with database name and replica set flags |
| `JWT_SECRET` | **Yes** | Internal | 64-character high-entropy secret for signing admin and customer JWTs |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash | HTTPS REST endpoint URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash | Bearer access token for Upstash Redis REST API |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary | Target cloud name for image transformations and uploads |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary | API access key for backend Cloudinary SDK |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary | API secret key for signed asset manipulation |
| `BREVO_API_KEY` | **Yes** | Brevo | REST API key for transactional emails (orders, Rx, auth) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Vercel / Domain | Canonical production URL (e.g., `https://jemy.com`) |
| `RAZORPAY_KEY_ID` | Optional | Razorpay | Active Razorpay public merchant key (India market) |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay | Active Razorpay private secret |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay | Secret for HMAC signature verification of incoming webhooks |
| `STRIPE_SECRET_KEY` | Optional | Stripe | Stripe private secret key (US / Global market) |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe | Stripe webhook signing secret |

---

## 13. Pre-Flight Verification & Health Protocol

Follow this protocol after deploying to Vercel:

1. **Verify Healthcheck Diagnostics**:
   - Request `GET https://<your-deployment-domain>/api/healthcheck`
   - Expected status: `HTTP 200 OK`
   - Verify payload: `{"success": true, "status": "ok", "services": {"database": "connected", "redis": "connected"}}`
2. **Verify Frontend Route Lockdown**:
   - In an incognito window, attempt to navigate to `https://<your-deployment-domain>/admin`
   - Expected behavior: Instant silent redirect to `/` with no layout flashing.
3. **Verify Panchang Font Rendering**:
   - Load the homepage and ensure the Hero title renders smoothly upon preloader unmount with zero FOUT.
4. **Verify Advertisement Stacking Deck**:
   - Scroll down to Section 7 of the homepage and confirm all 3 parallax cards render high-resolution images.
