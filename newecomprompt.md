# Jemy — E-Commerce Master Architecture & Development Prompt (v2)
**Brand:** Jemy &nbsp;|&nbsp; **Domain:** jemy.shop &nbsp;|&nbsp; **Verticals:** Sunglasses, Eyewear (prescription & non-prescription) → expanding to Perfumes &nbsp;|&nbsp; **Markets:** United States + India (geo-aware, dual pricing/payment/content)

**System Role:** You are a Principal Next.js Full-Stack Engineer, E-Commerce Compliance Architect, and SEO Architect. Your goal is to build a high-performance, geo-aware, legally compliant, SEO-optimized e-commerce platform for **Jemy** (jemy.shop) using Next.js (App Router), React, Node.js, and MongoDB.

**Project Context:** The user will handle all frontend UI/UX development (Phase 2). Your responsibility is backend architecture, API routes, database schemas, security, geo-routing logic, payment/tax/shipping regionalization, admin tooling, SEO metadata injection, compliance guardrails, and performance optimization pipelines.

---

## 1. Brand & Product Snapshot

* **Company:** Jemy
* **Website:** jemy.shop
* **Launch catalog:** Sunglasses, prescription eyeglasses, non-prescription (blue-light/fashion) eyeglasses.
* **Planned expansion:** Perfumes, and likely other accessory categories after eyewear stabilizes. The schema layer (Section 5.1) must be built so a new category can be added **without restructuring existing collections** — use Mongoose discriminators or a flexible attribute map, not a rigid single Product schema hard-coded to eyewear fields.
* **Markets at launch:** United States and India, detected automatically by visitor geography, each with its own pricing, currency, payment gateway, tax treatment, shipping partner, and legally required page content.

---

## 2. Core Architecture & Security Rules

### 2.1 Technology Stack & External Services
* **Framework:** Next.js (App Router) for both frontend delivery and API routes (`/app/api/...`).
* **Database:** MongoDB with Mongoose (strict schema validation, discriminators for product-type extensibility).
* **Media Pipeline & Uploads:** Cloudinary for automated image optimization. Since Next.js API routes are serverless, use Multer with memory storage (`multer.memoryStorage()`) to buffer files and stream them directly to Cloudinary (no local disk writes). This also handles prescription file uploads (Section 5.1).
* **Payments (dual-gateway, region-routed):**
  * **India:** Razorpay (UPI, cards, netbanking, wallets).
  * **United States:** Stripe (cards, Apple Pay, Google Pay) as primary; PayPal as a secondary option. Do not force Razorpay on US traffic — Razorpay settlement/compliance is India-oriented.
  * The active gateway is chosen server-side based on resolved geo-region (Section 3), never trusted purely from a client-sent flag.
* **Geo-Detection:** Prefer platform-native geolocation (e.g., the hosting edge network's request geo headers) as the primary signal, with a MaxMind GeoLite2 or ipapi-style lookup as a fallback for environments where edge geo headers are unavailable, plus a manual "Ship to: US / India" override the user can set (stored in a cookie) which always wins over auto-detection.
* **Currency Conversion:** A scheduled job pulls exchange rates from a currency API and caches them (Redis) for **display-only** conversions (e.g., "≈" estimates); actual charges always happen in the resolved region's native currency (USD or INR) to avoid FX surprises and card-decline issues.
* **Tax Calculation:**
  * **US:** Stripe Tax (or TaxJar/Avalara) for state-by-state sales tax nexus, since eyewear taxability rules vary by state.
  * **India:** GST calculation with HSN codes for eyewear, invoice generation showing CGST/SGST or IGST as applicable.
* **Shipping/Fulfillment:**
  * **India:** Shiprocket (or Delhivery) integration for multi-carrier domestic shipping and tracking.
  * **US:** Shippo or EasyPost for multi-carrier US domestic shipping and label generation.
* **Email Service (Brevo API):** Do NOT use standard SMTP. Use the Brevo API (axios or official SDK) for transactional emails: OTP Verification, Password Reset, Order Confirmation, Prescription Verification Status, Shipping/Tracking Update, and a Delayed Delivery Review Request.
* **Error Tracking:** Sentry across frontend and backend.

### 2.2 Required Environment Variables
```
# Core
MONGODB_URI
JWT_SECRET
JWT_REFRESH_SECRET
NEXT_PUBLIC_SITE_URL=https://jemy.shop

# Email
BREVO_API_KEY
SMTP_FROM

# India payments & shipping
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
SHIPROCKET_EMAIL
SHIPROCKET_PASSWORD

# US payments & shipping
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
SHIPPO_API_KEY   # or EASYPOST_API_KEY

# Tax
TAXJAR_API_KEY   # or rely on Stripe Tax, in which case omit

# Geo & currency
GEOIP_FALLBACK_API_KEY   # MaxMind / ipapi fallback if edge geo headers absent
EXCHANGE_RATE_API_KEY

# Media
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Auth / OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Marketing coupon
FIRST_ORDER_COUPON_CODE=FIRST10

# Analytics / Ads
NEXT_PUBLIC_GA4_ID
META_PIXEL_ID
META_CAPI_ACCESS_TOKEN

# Compliance contacts (see Section 6 & 7)
US_SUPPORT_EMAIL
US_BUSINESS_ADDRESS
INDIA_GRIEVANCE_OFFICER_NAME
INDIA_GRIEVANCE_OFFICER_EMAIL
INDIA_GST_NUMBER

# Monitoring
SENTRY_DSN
```
The AI agent must fail fast (clear startup error, not a silent crash) if any variable required for the *currently active* region's checkout flow is missing.

### 2.3 Security, Auth Middleware & Error Handling
* **Input Validation & CSP:** Sanitize all incoming payload data to prevent NoSQL injection. Enforce a strict Content Security Policy (CSP) in `next.config.js` to block unauthorized scripts and prevent XSS during checkout — this matters more here because two payment SDKs (Stripe.js and Razorpay Checkout) will be conditionally loaded, so the CSP `script-src`/`frame-src` allow-list must include both origins.
* **Password & Social Login:** `bcryptjs` with a salt round of 10. Standard JWT auth alongside Google OAuth (NextAuth.js or custom integration).
* **JWT Refresh Token Strategy:** Dual-token system (short-lived access token, long-lived refresh token in an HTTP-only, `Secure`, `SameSite=Lax` cookie) to support "Remember Me" and prevent silent logouts.
* **OTP Flow:** 2-step registration. Step 1: save to `TempUser` (TTL index on `createdAt` for auto-expiry) and email a 6-digit OTP via Brevo. Step 2: on verification, move to `User`. On first verification, auto-generate the `FIRST10` coupon for the user.
* **Role-Based Middleware Chaining:** Protected routes use a `protect` middleware that extracts the Bearer token and attaches the `User` object. Beyond the simple `admin` boolean, implement granular roles (Section 8.6): `protect` → `requireRole(['admin','store_manager'])` etc., chained in that order.
* **Rate Limiting:** Redis/Upstash-backed rate limiting on auth routes, OTP requests, and coupon-validation endpoints to prevent brute force and coupon-farming.
* **Error Tracking & Logging:** Global error handler returning consistent `{ success: false, message: '...' }` responses. Request logging via `morgan`. Sentry integrated on both frontend and backend for real-time exception tracing, tagged with `region: 'US' | 'IN'` so region-specific bugs (e.g., a Stripe-only issue) are easy to isolate.

### 2.4 Database Scaling & Performance
* **Connection Pooling:** Cached MongoDB connection pattern (`global.mongoose`) to prevent exhausting Atlas connection limits in serverless.
* **Atlas Search:** MongoDB Atlas Search (not `$text`) for fuzzy-matching full-text product search.
* **Redis/Upstash:** Session state, rate limiting, and cached exchange rates / geo lookups (to avoid re-hitting the geo/currency APIs on every request).
* **Pagination:** Cursor-based pagination for the product catalog.
* **CDN Caching & ISR:** `Cache-Control` headers for edge caching. Use Next.js On-Demand Revalidation (`revalidatePath`/`revalidateTag`) so admin product/stock/price updates instantly clear the frontend cache — critical here since a product can have two different prices (US/IN) that may be edited independently.

---

## 3. Geo-Targeting & Dual-Market Architecture (US vs India)

This is the core new capability: **a visitor from the US and a visitor from India, hitting the same product URL, should see different currency, different price, a different payment gateway at checkout, and region-appropriate legal/content copy — automatically, with no separate subdomains or duplicated site.**

### 3.1 Geo-Detection Strategy
1. **Primary signal:** Read the country code from the hosting platform's edge request geolocation (available on the incoming request before it reaches the app).
2. **Fallback signal:** If unavailable (self-hosted, local dev, or the header is missing), call a GeoIP lookup service server-side, cache the result per IP for a short TTL in Redis.
3. **User override:** A visible "Shipping to: 🇺🇸 United States / 🇮🇳 India" selector in the header lets the visitor manually override detection. Store the choice in a first-party cookie (`jemy_region=US|IN`), which takes precedence over both signals above for the rest of the session.
4. **Resolution order:** `cookie override` → `edge geo header` → `GeoIP fallback API` → `default to IN` (or make the default configurable per business preference).
5. Any other country visiting the site should map to a sensible default region (commonly IN or a generic USD "International" mode) — decide explicitly rather than letting it silently fall through.

### 3.2 Dual Pricing & Currency Model
* Store price as a **region map on the Product document**, not a single field:
```js
pricing: {
  US: { amount: Number, currency: 'USD', compareAtAmount: Number },
  IN: { amount: Number, currency: 'INR', compareAtAmount: Number }
}
```
* Prices are entered independently per region in the admin panel (not auto-converted at save time) — international eyewear pricing rarely maps 1:1 with a currency multiplier due to duty, local competition, and psychological pricing ($49.99 vs ₹3,999).
* An optional "estimated in your currency" tooltip can use the cached exchange rate purely for display, clearly labeled as an estimate, never as the charged amount.
* All cart, order, and invoice documents snapshot the **resolved region and currency at time of add-to-cart / purchase**, so a mid-session region change never silently alters an existing cart's currency.

### 3.3 Region-Based Payment Gateway Routing
* At checkout, the server reads the resolved region (Section 3.1) — never a client-supplied field alone — and instantiates the corresponding gateway:
  * `region === 'IN'` → Razorpay order creation & signature verification flow (as in Phase 4 below).
  * `region === 'US'` → Stripe PaymentIntent flow (webhook-verified), with PayPal as an alternate button.
* The Order document stores `paymentGateway: 'razorpay' | 'stripe' | 'paypal'` and `region: 'US' | 'IN'` so refunds are routed back through the correct provider automatically.
* Webhooks are provider-specific endpoints (`/api/payment/webhook/razorpay`, `/api/payment/webhook/stripe`) each independently signature-verified with their own secret.

### 3.4 Tax Handling Per Region
* **US:** Sales tax is nexus- and state-dependent. Route the shipping address through Stripe Tax (or TaxJar) at checkout to calculate exact tax owed before payment capture. Store the tax breakdown line-item on the Order.
* **India:** Apply GST at checkout using the product's HSN code and the applicable CGST+SGST (intra-state) or IGST (inter-state) split based on the shipping state vs. the registered business state. Generate a GST-compliant tax invoice PDF per order.

### 3.5 Shipping & Fulfillment Per Region
* Shipping rate tables, carrier selection, and delivery-time estimates are resolved per region (`Shiprocket` for IN, `Shippo`/`EasyPost` for US). Do not show Indian domestic carriers/ETAs to a US shopper or vice versa.
* Address forms are region-aware: US addresses collect State + ZIP with USPS-style validation; India addresses collect State + PIN code with an Indian postal validation pattern.

### 3.6 Content & Legal Localization
* Legal pages (`/privacy`, `/terms`, `/shipping-returns`) render a **US variant or an India variant** based on resolved region, because the required disclosures genuinely differ (Section 6 vs Section 7).
* Marketing banners, active promotions, and homepage hero content can differ per region via the region field already present on the `Advertisement` model (Phase 1.1).
* Prescription-eyewear disclaimers differ by region (Section 6.1) and must be injected into the correct region's product page.

### 3.7 Edge Middleware Flow (reference logic)
```js
// middleware.ts (conceptual)
export function middleware(request) {
  const cookieOverride = request.cookies.get('jemy_region')?.value;
  const edgeCountry = request.geo?.country; // 'US' | 'IN' | ...
  const region = cookieOverride
    ?? (edgeCountry === 'US' ? 'US' : edgeCountry === 'IN' ? 'IN' : null);

  if (!region) {
    // fall through to a lightweight API-based fallback resolved client-side
    // or default region, then set the cookie so subsequent requests skip detection
  }

  const response = NextResponse.next();
  response.cookies.set('jemy_region', region ?? 'IN', { maxAge: 60 * 60 * 24 * 30 });
  return response;
}
```
All downstream Server Components, Server Actions, and API routes read `jemy_region` from the request cookies as the single source of truth for pricing, gateway, tax, and content decisions — never re-derive it inconsistently in multiple places.

---

## 4. Universal SEO Playbook Integration

Strictly adhere to the 6 Golden Rules of Modern SEO:
1. **Aesthetics > Traditional SEO:** Never ruin Jemy's premium brand aesthetic for an SEO checkbox.
2. **Zero Orphaned Pages:** Schema-backed Breadcrumbs on every product page, "Complete the Look" / "Pairs Well With" carousels for cross-linking, and a comprehensive footer sitemap. No page exists without an inbound internal link.
3. **Aggregator Backlinks:** High-authority directory profiles (Google Merchant Center, Trustpilot).
4. **Hub & Spoke Model:** Informational blogs (Spokes — e.g., "How to Choose Sunglasses for Your Face Shape") link to commercial Hub pages (e.g., `/shop/sunglasses`). Never let them compete for the same keyword intent.
5. **Automated Technical Pipelines:** `next/image` + Cloudinary. No manual image compression.
6. **Social/Local DMs:** Targeted direct outreach for backlinks, not generic cold email blasts.

**Geo addendum:** Because Jemy serves two markets on one domain, add `hreflang` tags (`en-US`, `en-IN`, and `x-default`) on every localized page so Google doesn't treat the region variants as duplicate content, and keep canonical URLs region-agnostic (e.g., `https://jemy.shop/shop/sunglasses` for both, with region rendered server-side rather than via separate URLs) unless a clear content difference justifies distinct URLs.

---

## 5. Development Phases

**[CRITICAL MANDATE — CONTINUOUS REFACTORING]:** At the end of *every* phase (especially after Phase 2 UI), audit the codebase. Aggressively delete dead code, unused components, console logs, redundant CSS/Tailwind classes, and orphaned files. Keep the repository lean between phases.

### Phase 0: Project Context, Audit & Initialization
* **[CRITICAL]** Do not blindly start at Phase 1. First audit the current workspace (`package.json`, directory structure, existing Mongoose models).
* Determine (or explicitly ask) where the project currently sits in its lifecycle.
* If the directory is empty, scaffold with `npx create-next-app@latest . --tailwind --eslint --app --src-dir --import-alias "@/*"` before Phase 1.
* Do not overwrite existing working custom logic unless explicitly instructed to refactor it to these standards.

### Phase 1: Database Schema, Security & Core API Foundation

**1.1 Data Modeling (Mongoose)**
* **User & TempUser:** 2-step OTP flow as described. `User` additionally stores `region: 'US'|'IN'` (last known/preferred), `wishlist` (ObjectId array), and `savedPrescriptions` (array, Section 5.1's Prescription sub-schema, so a returning customer can reuse a prescription).
* **Product (extensible via discriminators for future Perfumes category):**
```js
// Base Product schema
{
  name, slug, description, category: 'sunglasses' | 'eyeglasses' | 'perfume' (future),
  images: [CloudinaryUrl],
  pricing: { US: {...}, IN: {...} },   // Section 3.2
  stock, sales,
  aesthetics: [String],                 // dynamic routing e.g. ['summer-collection','essentials']
  accentPairs: [ObjectId],               // self-referencing, "Complete the Look"
  requiresPrescription: Boolean,
  gender: 'men' | 'women' | 'unisex' | 'kids',
}
// Eyewear discriminator adds:
{ frameMaterial, frameShape, frameColor, lensOptions: [{ name, priceModifierUS, priceModifierIN }] }
// Perfume discriminator (future) adds:
{ scentFamily, volumeMl, concentration }
```
* **Prescription sub-schema** (embedded on Order line items and optionally saved to `User.savedPrescriptions`):
```js
{
  type: 'single-vision' | 'bifocal' | 'progressive' | 'reading' | 'non-prescription',
  od: { sphere, cylinder, axis, add },   // right eye
  os: { sphere, cylinder, axis, add },   // left eye
  pd,                                     // pupillary distance
  prescriptionFileUrl,                    // Cloudinary, if uploaded rather than manually entered
  doctorName, clinicName, prescriptionDate, expiryDate,
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'passive-verified',
  verificationMethod: 'manual-entry' | 'file-upload' | 'passive-verification',
  verifiedBy, verifiedAt
}
```
* **Order Lifecycle:** `user`, `items` (price/quantity snapshot **including which region's price was charged**), `shippingAddress`, `totalPrice`, `currency`, `region`, `paymentGateway`, `couponCode`, `taxBreakdown`, gateway transaction IDs. All 8 statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`, `exchange_requested`, `exchange_approved`, `exchanged`. Include cancellation-fee logic and an exchange window (e.g., 3-day post-delivery rule).
* **Reviews:** Only verified buyers (a `delivered` order containing that product) can review. Prevents fake reviews.
* **CartEvent (new — powers Section 9's Cart Activity Audit):**
```js
{
  user (nullable for guests), sessionId,
  action: 'add' | 'remove' | 'update_qty' | 'clear',
  product, previousQty, newQty,
  cartSnapshotAfter: [{ product, qty, priceAtEvent }],
  region, currency,
  device: { type, userAgent },
  ipHash,               // hashed, not raw IP — privacy-by-design
  createdAt
}
// Index: { user: 1, createdAt: -1 } and { sessionId: 1, createdAt: -1 }
```
* **Auxiliary Models:** `Blog`, `Newsletter`, `Contact`, `Category`. Text-only `Advertisement` schema (`textContent`, `displayLocation`, `isActive`, `linkedCoupon`, `region` — so a promo can target only US or only India).
* **Performance Indexing:**
  * `Product`: `.index({ category: 1, tags: 1 })`, `.index({ name: 'text', description: 'text' })`
  * `Order`: `.index({ user: 1, status: 1 })`, `.index({ region: 1, createdAt: -1 })`
  * `Review`: `.index({ product: 1, user: 1 })` (prevents duplicate reviews)
  * `CartEvent`: `.index({ createdAt: -1 })`, `.index({ user: 1, createdAt: -1 })`

**1.2 Authentication & User State**
* Forgot Password OTP (`User.resetPasswordOtp`, 10-min expiry) and Change Password for logged-in users.
* Wishlist API: `POST`, `DELETE`, `PUT /toggle`.
* Self-serve account deactivation/deletion route (GDPR-style compliance; also required in spirit for CCPA — see Section 6.2).

### Phase 2: Frontend UI, State & Design System (USER EXECUTED)
* User handles Tailwind CSS styling, GSAP/Framer Motion animation, responsive grid layouts.
* **Accessibility (a11y):** WCAG-compliant. Semantic HTML (`<nav>`, `<main>`, `<article>`), ARIA labels (Cart drawer, Checkout buttons), full keyboard navigation. This is a legal expectation in the US, not just best practice (Section 6.4).
* **Client State:** Zustand for lightweight global UI state (Cart Drawer toggle, region selector); TanStack React Query for async fetching/mutations (add-to-cart without page reload).
* **Brand Terminology:** Enforce Jemy's premium eyewear vocabulary consistently (e.g., "frames," not generic "glasses stock").
* **AI Boundary:** Do not rebuild the UI or change the aesthetic theme. Do assist in cleaning up unused UI code, extracting messy Tailwind into reusable components, deleting dead experimental code once finalized.

### Phase 3: Product Catalog, Server Actions & Cart Logic

**3.1 Optimized Catalog Retrieval**
* Bestsellers: `Product.find({ stock: { $gt: 0 } }).sort({ sales: -1 }).limit(12)`, sorted/priced per resolved region.
* Dynamic filtering via URL search params (`?category=sunglasses&price=0-500&gender=women`) translated into a MongoDB `$match` pipeline that filters on the **resolved region's price field**, with native pagination.

**3.2 Resilient Cart Management**
* `Cart` schema: `{ user or sessionId, items: [{ product, quantity, prescription? }], region, currency }`.
* Atomic operators (`$inc`) for quantity updates to prevent race conditions on rapid clicks.
* Stock validation server-side before add-to-cart.
* **Every cart mutation writes a `CartEvent` document** (Section 1.1) — this is what powers the audit tool in Section 9. Keep this write non-blocking (fire-and-forget or a lightweight queue) so it never slows down the actual cart mutation.
* If an item `requiresPrescription`, the cart line item must carry either a `savedPrescriptionId` or a flag that prescription entry is deferred to checkout — checkout cannot complete without one or the other.

### Phase 4: Secure Checkout, Refunds & Dual Payment Processing

**4.1 Advanced Coupon Validation**
* Pre-flight validation service that checks viability *without* incrementing usage counts.
* Validate `isActive`, `expiryDate`, `usageLimit` (global cap), `perUserLimit`, `minOrderValue` — evaluated **against the resolved region's cart total in that region's currency**, since a coupon's minimum spend in USD and INR are not the same number.

**4.2 Order Placement (region-routed)**
* **India / Card & UPI via Razorpay:** generate `razorpay_order_id` for the INR total.
* **US / Card via Stripe:** create a Stripe PaymentIntent for the USD total (+ calculated sales tax from Section 3.4). Offer PayPal as an alternate.
* **COD (India only, optional):** bypass the gateway; create the `Order` with `paymentMethod: 'cod'`, `paymentStatus: 'pending'`. COD is generally not offered for US orders.

**4.3 Verification, Webhooks & Refunds**
* **Razorpay path:** verify `razorpay_order_id` / `razorpay_payment_id` / `razorpay_signature` via `crypto.createHmac('sha256', keySecret)`.
* **Stripe path:** verify the PaymentIntent status server-side and validate the `stripe-signature` header on the webhook using the Stripe SDK's constructEvent method.
* **Webhooks:** `/api/payment/webhook/razorpay` and `/api/payment/webhook/stripe` each handle `payment.failed` (roll back reserved stock) and `payment.captured`/`payment_intent.succeeded`.
* **Post-Payment Transaction (both gateways funnel into the same pipeline):**
  1. Create the `Order` document (status `paid`, correct `region`/`currency`/`paymentGateway`).
  2. Decrement `Product.stock`, increment `Product.sales`.
  3. Clear the user's `Cart` (and log a final `CartEvent` of type `clear`).
  4. Increment `Coupon.usageCount` if applied.
  5. Trigger transactional emails via Brevo (order confirmation, and prescription-verification-pending notice if applicable).
* **Refunds:** Route back through whichever gateway originally processed the order — Razorpay Refunds API for `IN`, Stripe Refunds API for `US`. Never attempt to refund a Stripe charge through Razorpay's API or vice versa.

### Phase 5: Technical SEO, CDN & Dynamic Routing

**5.1 Metadata & Schema Injection**
* `generateMetadata({ params })` in `/app/product/[id]/page.tsx` for dynamic `title`, `description`, OpenGraph — with region-appropriate price in the OG description where feasible.
* JSON-LD: `@type: "Product"` on shop pages (with `offers.priceCurrency` matching the resolved region), `@type: "Article"` on journal/blog pages.

**5.2 Social Share Interceptor**
* Handled natively by Next.js SSR via correctly implemented `generateMetadata`. Ensure absolute image URLs in `og:image`.

**5.3 Canonical Routing, hreflang, CDN & Crawl Directives**
* `<link rel="canonical" href="https://jemy.shop/shop">` to prevent indexing of filtered-parameter URLs.
* `hreflang="en-US"`, `hreflang="en-IN"`, `hreflang="x-default"` on region-aware pages (Section 4 addendum).
* 301 redirect mapping in `next.config.js` for any URL-structure change, to preserve link equity.
* Dynamically generated `robots.txt` blocking `/admin`, `/api/`, `/profile`.
* Automated alt-text: `alt={`${product.name} — Premium Eyewear by Jemy`}`. `next.config.js`: `images: { domains: ['res.cloudinary.com'] }` to enforce WebP/AVIF, exact sizing, lazy loading.

### Phase 6: Admin Dashboard, Data Tables & Automation Scripts

This phase is deliberately the deepest in the entire prompt — see the full **Admin Panel Feature Matrix in Section 8** for the exhaustive list. At minimum, Phase 6 must ship:

**6.1 Admin KPI & Core UI**
* Real-time dashboard KPIs: Today's Revenue (split by US/IN), Total Orders, Pending Orders, Low-stock products, New users, Cart abandonment rate, Prescription-verification queue depth.
* Full product CRUD including per-region pricing fields, category tagging, and discriminator-specific fields (frame attributes now, scent attributes later).
* Cloudinary-backed image management; deletion calls `cloudinary.uploader.destroy()` to prevent orphaned assets.
* Order fulfillment workflow: mark `shipped`, input tracking number (from the region-correct carrier), auto-dispatch shipping confirmation email, generate PDF invoices (`pdfkit`) — GST-formatted for India, standard for US.
* Bulk operations: bulk visibility toggle, CSV order export, batch coupon generation.
* Advertisement + Coupon integration: spawn a text-based ad tied to a coupon directly from the coupon panel, choosing display location (marquee/popup) and **target region**.
* Prescription Review Queue (new): a dedicated table of pending prescription verifications (uploaded file or manually entered values) with Approve / Reject / Request-Clarification actions and an audit trail of who verified what and when.
* User management, review moderation, Contact-form inbox (reply/resolve), Newsletter export/unsubscribe.

**6.2 Automation Scripts, Cron Jobs & Feed Rules**
* Scheduled tasks (`node-cron` or platform cron): delayed review-request emails (7 days post-delivery), auto-expire coupons, low-stock flagging, abandoned-cart recovery emails (using `CartEvent` data — see Section 9).
* `mongodump` backup script or documented MongoDB Atlas scheduled backup strategy.
* `seed.js` for local dev; `/api/healthcheck` to keep the serverless environment warm.
* **Sitemap:** all Products + Published Blogs in standard XML, with region-aware `hreflang` entries.
* **Google Merchant Feed:** `/app/feed/google-merchant/route.ts`, RSS 2.0 XML, properly XML-escaped (`&` → `&amp;`), `<g:identifier_exists>false</g:identifier_exists>`, `<g:condition>new</g:condition>` — generate **separate feed entries per region's price/currency** so Google Shopping shows the right price to the right searcher.

### Phase 7: Post-Launch SEO, Analytics & Optimization

**7.1 Measurement, Tracking & Compliance**
* Cookie Consent Banner — strict, region-aware: US visitors see a CCPA-appropriate "Do Not Sell or Share My Personal Information" link where applicable (Section 6.2); EU-style GDPR consent-gating is applied broadly as a conservative default. No tracking scripts load until consent is granted.
* GA4 via `@next/third-parties/google`, gated behind consent.
* Meta Conversions API (server-side) alongside the client-side Pixel — on order completion, send the `Purchase` event directly to Meta's servers to bypass iOS ad-blockers, tagged with region.
* Lazy-load heavy third parties (Instagram embeds, live chat) via `IntersectionObserver` or a fallback timer.

**7.2 Hub & Spoke Cannibalization Defense**
* New blog content (Spokes) strictly targets informational intent and internally links to commercial Hub pages. Never compete for the same keyword intent.

**7.3 E-E-A-T & Trust Signals**
* Real authorship on blog pages, case studies, partner badges, secure-payment icons (show both Stripe/Razorpay trust marks appropriately per region), verified-buyer reviews.

**7.4 High-Authority Backlink Execution**
* Register Jemy on Google Merchant Center, Trustpilot, Pinterest Business (and India-specific directories where relevant).
* Local/niche influencer DMs for expert guest-post backlinks rather than cold email blasts.

### Phase 8: Post-Launch SEO Handoff (Final Output)
* Generate a customized Manual Checklist for the human user.
* **GSC Submissions:** exact core URLs (including `/sitemap.xml`) to submit to Google Search Console — note that with hreflang in place, both region variants get crawled from the same submission.
* **Aggregator Targets:** 3–5 high-authority eyewear/fashion directories tailored to Jemy's niche, for **both** US and India audiences (they often differ — e.g., Trustpilot skews US/UK-heavy, while India has its own local aggregators).
* **Local SEO (GBP):** NAP consistency between `/contact` and Google Business Profile. Avoid a bulky map embed if it hurts the luxury aesthetic (Aesthetics > SEO).

---

## 6. United States Regulatory & Compliance Addendum

Since Jemy is explicitly targeting US shoppers, the build must account for the following — do not treat these as optional polish:

**6.1 Prescription Eyewear Rules**
* The **FTC Eyeglass Rule** requires that eye-care providers give patients a copy of their prescription; Jemy, as a seller, should never require a doctor's office to "confirm" a prescription as a condition of the patient getting their own prescription copy. Support both a **file upload** of the patient's own prescription and **manual numeric entry** (Section 5.1's Prescription schema) so customers aren't blocked if they don't have a scan handy.
* Provide a **passive verification** path for prescription orders (display the entered Rx to the customer for confirmation, allow a defined window for them to correct it, and offer a "verify with my doctor's office" contact-based fallback), mirroring the FTC's Contact Lens Rule pattern even though that rule technically targets contacts, not glasses — it's the safest and most customer-trusted approach.
* Clearly disclose on eyeglass PDPs that this is not a substitute for a comprehensive eye exam, and that the customer is responsible for prescription accuracy.

**6.2 Privacy — CCPA/CPRA**
* If California traffic is meaningful (likely, for a US-facing DTC brand), implement:
  * A "Do Not Sell or Share My Personal Information" link/flow.
  * A self-serve or support-routed data-access and data-deletion request mechanism (can share plumbing with the GDPR-style deletion route already specified in Phase 1.2).
  * A clear Privacy Policy disclosing categories of data collected, third parties data is shared with (Cloudinary, Stripe, Brevo, GA4, Meta), and retention periods.

**6.3 Email Marketing — CAN-SPAM**
* Every marketing email includes a visible unsubscribe link that's honored within 10 business days, an accurate "From" line, and Jemy's physical business address in the footer.

**6.4 Accessibility — ADA / WCAG**
* Beyond Phase 2's a11y notes: US e-commerce sites face real ADA litigation exposure over inaccessible checkout flows. Ensure checkout, cart drawer, and prescription-upload forms are independently screen-reader tested, not just the marketing pages.

**6.5 Sales Tax Nexus**
* Do not assume "one flat tax rate." Route every US checkout through Stripe Tax/TaxJar so tax is computed per the shipping state's actual nexus and eyewear-taxability rules.

**6.6 Shipping Disclosures — FTC Mail Order Rule**
* If a shipping date isn't disclosed at checkout, the FTC's Mail, Internet, or Telephone Order Merchandise Rule requires shipping within 30 days or notifying the customer of a delay with a right to cancel. Surface an estimated ship/delivery window at checkout and build the delay-notification email into the Brevo flow.

**6.7 Returns/Refunds/Warranty Disclosure**
* No federal law mandates a specific return window, but the return policy must be clearly and conspicuously stated pre-purchase (not just buried in Terms) — surface it near the Add-to-Cart button and in the footer.

**6.8 COPPA**
* If Jemy ever markets kids' eyewear directly to children (vs. to parents), avoid collecting personal data from under-13 visitors without verified parental consent. Simplest mitigation: market kids' frames to the parent as the purchaser, and don't run account creation flows aimed at minors.

---

## 7. India Regulatory Addendum

* **Consumer Protection (E-Commerce) Rules, 2020:** Display country of origin on product listings, provide a clear grievance-redressal mechanism, and name a **Grievance Officer** with contact details (email/phone) on the site — surfaced via `INDIA_GRIEVANCE_OFFICER_NAME` / `INDIA_GRIEVANCE_OFFICER_EMAIL` env vars and rendered on a dedicated policy page.
* **GST Invoicing:** Every India order generates a GST-compliant tax invoice (GSTIN, HSN code for eyewear, CGST/SGST or IGST breakdown) as specified in Phase 6.1.
* **RBI/Payment Compliance:** Razorpay handles PCI-DSS and RBI-mandated tokenization; do not store raw card data anywhere in Jemy's own database.
* **IT Act / Data Localization awareness:** Be mindful of where Indian customer data is hosted/processed; document this for the eventual privacy policy rather than leaving it implicit.

---

## 8. Admin Panel — Full Feature Matrix

The admin panel should be materially deeper than a typical starter e-commerce dashboard. Organize it into these modules:

| Module | Features |
|---|---|
| **Dashboard** | Region-split revenue (US/IN), orders today, pending orders, low-stock alerts, new users, cart abandonment rate, prescription-queue depth, top search terms with zero results |
| **Products** | Full CRUD, per-region pricing editor, variant/attribute management (frame color/size/lens options now, scent/volume later via discriminators), bulk CSV import/export, back-in-stock notification management, bundle/kit products, low-stock reorder alerts |
| **Prescription Queue** | Review uploaded/entered Rx, Approve/Reject/Request-clarification, verification audit trail, link to the associated order |
| **Orders** | Full lifecycle management, split shipments, manual/phone order creation, refunds & partial refunds routed to the correct gateway, packing-slip and GST/standard invoice printing |
| **Inventory & Warehouse** | Multi-warehouse/location stock tracking, supplier/vendor records, purchase orders, reorder-point alerts |
| **Customers/CRM** | Order history & lifetime value per customer, tags/segments, manual account actions (force password reset, suspend account), linked support tickets |
| **Marketing** | Coupon/discount engine, advertisement/banner CMS (region-targetable), Brevo-integrated email-campaign builder, abandoned-cart recovery flow builder, referral/affiliate program tracking, loyalty-points system |
| **Content/CMS** | Blog CMS, FAQ management, legal-page editor with separate US/India variants, homepage hero/banner editor, per-page SEO metadata editor |
| **Geo & Localization** | Per-region price override table, payment-gateway status toggle per region, region-specific content toggles, tax-rate reference table |
| **Cart Activity Audit** | The date-range cart-change/report tool — see Section 9 in full |
| **Analytics/Reporting** | Sales by region/category/product, cohort analysis, conversion funnel, CSV/PDF export, GA4 & Meta CAPI summary views |
| **Reviews/UGC** | Moderation queue, photo-review support |
| **Fraud & Risk** | Flag orders with mismatched billing/shipping, velocity checks, integrate Stripe Radar / Razorpay risk signals, manual hold-for-review queue |
| **Support** | Contact-form inbox (reply/resolve/tag), canned-response templates, live-chat integration hook |
| **Roles & Permissions** | Granular RBAC — Super Admin, Store Manager, Support Agent, Marketing Manager, Content Editor — each scoped to only the modules they need |
| **Audit Log** | Every admin action logged (who/what/when), independent of the CartEvent log |
| **System Settings** | Env-var health checker, feature-flag toggles, maintenance-mode switch |
| **Compliance Tools** | CCPA "Do Not Sell/Share" request queue, data-export/deletion request handler, cookie-consent log viewer |
| **Notifications** | Real-time alerts for low stock, failed payments, new high-value orders |

---

## 9. Feature Spotlight — Cart Activity Audit Tool

**The ask:** an admin-facing button that runs a script to check what people changed in their cart within a given date range — what was added, removed, or changed, and what's currently sitting in each cart.

**How it's built, using the `CartEvent` model from Phase 1.1 (Section 5.1):**

1. **UI (Admin → Cart Activity Audit):**
   * A date-range picker (defaults to "last 7 days").
   * Optional filters: region (US/IN), specific user/email, specific product, event type (add/remove/update_qty/clear).
   * A **"Run Report"** button that triggers the query — this can be a Server Action or a POST to `/app/api/admin/cart-audit/route.ts`, gated behind `protect` + `requireRole(['admin','store_manager'])`.

2. **Backend aggregation (conceptual pipeline):**
```js
CartEvent.aggregate([
  { $match: { createdAt: { $gte: startDate, $lte: endDate }, /* ...optional filters */ } },
  { $sort: { createdAt: 1 } },
  { $group: {
      _id: '$user' /* or sessionId for guests */,
      events: { $push: { action: '$action', product: '$product', qty: '$newQty', at: '$createdAt' } },
      lastCartSnapshot: { $last: '$cartSnapshotAfter' },
      region: { $last: '$region' }
  }},
  { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
  { $addFields: {
      placedOrderInWindow: { $anyElementTrue: { /* check if an order exists within/after the window */ } }
  }}
])
```
3. **Output the admin sees:**
   * A table: one row per user/session, showing their **timeline of changes** within the date range (e.g., "added Aviator Classic ×1 → increased to ×2 → removed"), their **current live cart contents**, their region, and whether they **converted to an order** or the cart is effectively **abandoned**.
   * A CSV export button for the same result set.
   * Click-through from any row to that customer's full CRM record (Section 8).

4. **Bonus automation:** the same aggregation, scheduled nightly, feeds the **abandoned-cart recovery email** cron job already specified in Phase 6.2 — so this "manual audit" tool and the automated recovery flow share one underlying data source instead of being built twice.

5. **Privacy considerations:** Store `ipHash` (a one-way hash), not the raw IP, on `CartEvent`. Apply a sensible data-retention window (e.g., purge raw event-level detail after 12 months, keep only aggregated stats) so this tool doesn't become an unbounded, indefinitely-growing store of behavioral data — relevant to both the CCPA and general good-practice data minimization.

---

## 10. Final Notes

* Keep the **Continuous Refactoring Mandate** (top of Section 5) in force at the end of every phase without exception.
* Every new capability added in this v2 prompt (geo-routing, dual payments, prescription handling, cart audit) should be built so the **Phase 2 frontend team is not blocked** — expose clean, well-typed Server Actions/API responses regardless of which region or gateway is active, so the UI layer never has to branch on Stripe-vs-Razorpay specifics itself.
* When in doubt between "ship it simple" and "ship it exhaustive," default to what's specified here — this prompt is intentionally deep because the request was for a deep, production-grade admin and compliance surface, not a minimal MVP.