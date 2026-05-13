# VRS Demo (DriveLease) — Spring Boot backend

This module is the rental vehicle backend and serves static pages from `src/main/resources/static`.

## Run the application

From this directory (`VRS/demo`):

```bash
.\mvnw.cmd spring-boot:run
```

Default URL: **http://localhost:8080** (unless you changed the port).

Requirements: **Java 21**, **MySQL** with a database matching `application.properties` (URL, user, password). Hibernate `ddl-auto=update` will align schema when the app starts.

---

## Where to test (manual checklist)

Use these flows after any refactor to confirm nothing regressed.

### 1. Auth and profile

| What to check | Where |
|---------------|--------|
| Register / login | `static/login.html`, `static/register.html` (or your auth entry) |
| Profile loads bookings and damage list | `static/profile.html` — must be logged in (`driveRedUserSession` in localStorage) |

### 2. Vehicles and car details

| What to check | Where |
|---------------|--------|
| Vehicle list / catalog | `static/vehicles.html` (or home flow that lists cars) |
| Single vehicle page, specs without “daily allowance” in car details JS | `static/car-details.html?id=<vehicleId>` |
| Compare / filters still work | Same catalog pages |
| **Factory:** create vehicle via admin (full fields) — same as before; optional `POST /api/vehicles` with sparse body + `category: SUV` gets SUV defaults | Admin → Vehicles / API |

### 3. Checkout and pricing (Strategy pattern — **important**)

Pricing is computed on the server in `BookingService` → `BookingPricing` → plan strategies. Exercise each plan type if your UI exposes them:

| What to check | Where |
|---------------|--------|
| Checkout with **DAILY** plan | `static/checkout.html` (pick dates, complete flow) |
| Checkout with **WEEKLY / MONTHLY / YEARLY** if selectable | Same; confirm totals and no validation errors for minimum return window |
| Admin creates/updates booking with different plan | `static/admin/Admin.html` → Bookings — totals should persist like before |

**API-only smoke test (optional):** create a booking via `POST /api/bookings/checkout` with `planType` set to `DAILY`, `WEEKLY`, etc., and compare `totalAmount` / `subtotal` to previous behavior.

### 4. Damage reports (DB-backed)

| What to check | Where |
|---------------|--------|
| Logged-in user sees eligible rentals | `static/damageReports.html` — dropdown populated from API |
| Submit report → success shows server id | Same form; success reference `DMG-{id}` |
| Profile shows new damage row | `static/profile.html` |
| Admin damage list loads from DB | `static/admin/Admin.html` → Damages |

Relevant endpoints:

- `GET /api/damage-reports/eligible-rentals?userId=…`
- `POST /api/damage-reports`
- `GET /api/damage-reports` (admin list)
- `GET /api/auth/profile/{userId}` (includes damage reports)

### 5. Bookings admin

| What to check | Where |
|---------------|--------|
| List / create / edit / delete booking | Admin → Bookings |
| Vehicle availability updates after booking changes | Vehicle list status in admin or public vehicle availability |

---

## Design patterns in this codebase

Below is what is **actually implemented** in code today (not a roadmap).

### 1. Strategy — **rental plan pricing** (implemented)

**Intent:** Encapsulate each rental plan’s rules (discount on full package segments, calendar segment boundaries, first package end for validation) so they can vary without growing a single giant `switch`.

**Where:**

| Piece | Path |
|--------|------|
| Strategy types (enum constants per plan) | `src/main/java/com/example/demo/service/pricing/PricingPlanStrategy.java` |
| Context that uses the strategy | `src/main/java/com/example/demo/service/BookingPricing.java` — `discountPercentForPlan`, `firstPackagePeriodEnd`, `computeSubtotalSegments` delegate to `PricingPlanStrategy` |
| Callers (unchanged) | `src/main/java/com/example/demo/service/BookingService.java` — still calls `BookingPricing.computePriceBreakdown(...)` |

**How to read it:** Resolve the plan string to a `PricingPlanStrategy` enum value (`DAILY`, `WEEKLY`, …, `FALLBACK`). `DAILY` uses a simple per-day subtotal; other plans walk segments using `rawNextBoundary` and apply `packageDiscountPercent` only on “full” segments—matching the pre-refactor behavior.

---

### 2. Factory — **vehicle category assembly** (implemented)

**Intent:** Centralize how a new `Vehicle` is assembled before persistence: pick a **category profile** (Sedan, SUV, Van, …) and apply **type-specific defaults** only where the client left fields null or blank—so a full admin payload behaves as before, while minimal API payloads still get sensible defaults.

**Where:**

| Piece | Path |
|--------|------|
| Category “products” (profiles / defaults per type) | `src/main/java/com/example/demo/factory/VehicleCategoryProfile.java` |
| Factory entry point | `src/main/java/com/example/demo/factory/VehicleFactory.java` — `prepareNewVehicle(Vehicle)` |
| Uses the factory | `src/main/java/com/example/demo/controller/VehicleController.java` — `POST` create calls `vehicleFactory.prepareNewVehicle(vehicle)` before `save` |

**How to read it:** `VehicleCategoryProfile.fromCategory(...)` maps the request’s `category` string to an enum constant. `applyMissingDefaults` fills seats, transmission, fuel, engine, luggage, `dailyKm`, rating, match score, and badge **only** when missing. `VehicleFactory` also keeps the previous rule: default `availabilityStatus` to `"Available"` when omitted.

**Quick test:** `POST /api/vehicles` with only `name`, `brand`, `category` (e.g. `"SUV"`), `modelYear`, `city`, `pricePerDay`, `imageUrl`, `description` — response should include SUV-style defaults (e.g. 7 seats). Repeat with a full body (admin form); values you send explicitly should not change.

---

### 3. State — vehicle availability (not implemented)

Availability is stored as a string on `Vehicle` (`availabilityStatus`) and updated imperatively (e.g. `BookingService.refreshVehicleAvailability`). There is no State-pattern class hierarchy for transitions. If added later, document it here.

### 4. Singleton — rental coordination (not implemented as a GoF pattern)

Spring beans such as `BookingService` are singleton-scoped **by the framework** (one instance per application context). That is normal Spring usage, not a hand-written Singleton pattern for “rental coordination.” If a dedicated coordinator pattern is introduced, document it here.

---

## After you add more patterns

When State or other patterns are introduced:

1. Keep behavior backward-compatible or document breaking changes.
2. Run the manual checklist above.
3. Append a short subsection under **Design patterns** with file paths and one paragraph of intent.

---

## Vehicles page hero video (stored in MySQL)

The hero block on **`vehicles.html`** loads MP4 and optional poster URLs from the database so **any machine** using the same DB (or after you set the same rows on your friend’s DB) shows your video.

### How it works

| Piece | Path |
|--------|------|
| Table `site_properties` (created by Hibernate `ddl-auto=update`) | Entity `src/main/java/com/example/demo/model/SiteProperty.java` |
| Read / write | `SitePropertyService`, `SitePropertyRepository` |
| API | `src/main/java/com/example/demo/controller/SitePropertyController.java` |
| Browser | `static/js/vehicles.js` — `fetchVehiclesHeroVideo()` calls `GET /api/site-properties/vehicles-hero` and updates `<video>` |

**Keys:** `vehicles.hero.mp4` and `vehicles.hero.poster` (poster optional).

### Set the video once (you or your friend)

**Option A — HTTP (easiest after app is running)**

```http
PUT http://localhost:8080/api/site-properties/vehicles-hero
Content-Type: application/json

{
  "mp4": "https://YOUR-CDN-OR-SERVER/path/to/video.mp4",
  "poster": "https://YOUR-CDN-OR-SERVER/path/to/poster.jpg"
}
```

You can send **only** `"mp4": "..."` in the PUT body if you do not need a custom poster.

**Local files on your PC (`G:\...`, `C:\...`, `file:///...`)** — the browser **will not** load them for a page opened as `http://localhost:...` (you will see *Not allowed to load local resource*). Copy the MP4 and poster into `src/main/resources/static/hero-assets/`, restart the app, then store URLs like `http://localhost:8080/hero-assets/your-video.mp4` (see `static/hero-assets/README.txt`). The API `PUT` rejects `file:` and `X:\` style values with **400** and a short explanation.

**Option B — SQL in MySQL Workbench** (`USE vrs_db;` first)

```sql
INSERT INTO site_properties (property_key, property_value)
VALUES ('vehicles.hero.mp4', 'https://YOUR-CDN-OR-SERVER/path/to/video.mp4');

INSERT INTO site_properties (property_key, property_value)
VALUES ('vehicles.hero.poster', 'https://YOUR-CDN-OR-SERVER/path/to/poster.jpg');
```

If a row already exists, use `UPDATE site_properties SET property_value = 'https://...' WHERE property_key = 'vehicles.hero.mp4'` or the `PUT` above (upsert behavior).

**Verify in Workbench:** `SELECT * FROM site_properties;` — columns must be **`property_key`** and **`property_value`**. The key must be exactly **`vehicles.hero.mp4`**. Wrong names or a typo used to mean the API returned `"mp4": null`. On **app startup**, if that key is missing or the value is blank, the server **inserts a default Coverr MP4** so `GET /api/site-properties/vehicles-hero` still returns a playable `mp4`. Replace it with your URL via `UPDATE` or `PUT` when ready. The browser also falls back to the same default if the API is unreachable.

### Friend’s PC

1. Same **code** (pull from Git).  
2. Same **idea** for data: either **same database** (shared MySQL / dump restore) **or** they run the same **`PUT`** / **`INSERT`** on **their** `vrs_db` with the same URLs.  
3. The MP4 URL must be **reachable from the browser** (HTTPS; `<video src>` does not use CORS the same way as XHR, but the host must allow the request).

**Public URLs:** Hosting the file on **S3, Cloudinary, your own server, or GitHub raw** is fine as long as the URL returns `video/mp4` and allows playback.

---

## Configuration

Database and JPA settings: `src/main/resources/application.properties`.
