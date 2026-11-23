# Vanaris

**Vanaris** is a fleet-management system for aerial wildfire-suppression drones.
It pairs a React Native (Expo) mobile app with a Node.js/Express API so a field
operator can monitor a live drone fleet on a map, read real-time telemetry,
triage alerts, and manage the drone roster — all from a phone.

The name reflects the product's core idea: *suppression in the air, first.*
Instead of waiting for ground crews, Vanaris tracks a swarm of
firefighting drones that can be dispatched and watched in real time.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Mobile App Screens](#mobile-app-screens)
- [Authentication & Security](#authentication--security)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Mobile App Setup](#mobile-app-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Design System](#design-system)
- [Roadmap Ideas](#roadmap-ideas)
- [License](#license)

---

## Overview

A wildfire response team needs to know, at a glance: *where is every drone,
what is it doing, and is anything wrong?* Vanaris answers that with three
pillars:

1. **Live fleet map** — every active drone's position, rendered on a native
   map, refreshed on a short polling interval.
2. **Telemetry & alerts** — battery, status, and automatically generated
   alerts surfaced as a feed the operator can drill into.
3. **Fleet roster management** — authenticated operators can register new
   drones, edit specs, upload a photo, and retire drones that are no longer
   in service.

The project is split into two independently deployable halves:

- **`/` (root)** — the Expo/React Native mobile client.
- **`/server`** — the Express + Prisma + PostgreSQL API that the app talks to.

---

## Core Features

### Fleet Operations
- **Live map view** of every drone's last known position, deferred-mounted
  so the map never blocks the tab-switch animation.
- **Real-time telemetry polling** (battery, status, signal) refreshed every
  few seconds without a manual pull-to-refresh.
- **Alert feed** fed by the backend's telemetry evaluator, with detail pages
  per alert (`/alert/[id]`).
- **Drone detail pages** (`/drone/[id]`) showing full spec sheet, status
  badge, and a 3D model viewer.
- **3D drone model rendering** using `expo-gl` + `three.js` + `expo-three` to
  render a `.glb` firefighting-drone model directly inside the app.

### Fleet Management (authenticated)
- **Create / edit / delete drones** through a single reusable drone form
  (`app/drone-form.tsx`), including photo upload.
- **Status badges** (`standby`, active, etc.) with consistent color coding
  across list and detail views.
- **Optimistic-friendly request states** — every data-fetching screen has a
  matching loading skeleton, empty state, and error state component
  (`RequestState.tsx`) instead of a bare spinner.

### Account & Profile
- **Registration & login** with username + password.
- **Password strength meter** shown live while typing a new password
  (`PasswordStrengthMeter.tsx`), enforcing: 8+ characters, upper + lower
  case, and a digit.
- **Profile editing** — display name, password change, and avatar upload
  (stored as a data URI, no external object storage required).
- **Token-based sessions** persisted on-device so a user stays logged in
  across app restarts.
- **Theme switching** (light/dark) via a shared theme context used by every
  screen and component.

### Resilience
- The API never crashes on an unexpected promise rejection — every async
  route is wrapped so errors reach Express's error handler instead of
  hanging the request or killing the process.
- A sleeping/unreachable database (e.g. a serverless Postgres provider
  waking from idle) is translated into a clear `503 Database is temporarily
  unavailable` response instead of a raw Prisma stack trace, so the app can
  show the user something actionable.

---

## Architecture

```
┌─────────────────────────────┐        HTTPS / JSON        ┌───────────────────────────┐
│      Vanaris Mobile App      │  ────────────────────────▶ │       Vanaris API          │
│   Expo + React Native +      │                             │  Express + Prisma + JWT    │
│   Expo Router + expo-three   │  ◀────────────────────────  │                             │
└───────────────┬──────────────┘                             └──────────────┬─────────────┘
                │                                                             │
                │ renders                                                    │ reads/writes
                ▼                                                             ▼
   Native map · 3D .glb viewer                                    PostgreSQL (via Prisma ORM)
   Telemetry cards · Alert feed                                   Users · Drones
```

**Client → Server contract**

- The mobile app never talks to the database directly; every read/write goes
  through the REST API in `server/`.
- Auth state is a signed JWT handed back on login/register and attached as a
  bearer token on every mutating request (`lib/api.ts` + `lib/auth-context.tsx`).
- Telemetry and alerts are **derived data** (`server/live.js`), not stored
  rows — the server computes current telemetry/alerts from the live drone
  roster rather than persisting a separate telemetry table, keeping the
  schema small and the "live" feed always consistent with the roster.

**Request flow example — opening the Home tab**

1. `app/(tabs)/index.tsx` mounts and calls `useFetch(api.getTelemetry, ...)`
   on a 3s interval and `api.getAlerts` on a 30s interval.
2. `lib/api.ts` issues `GET /api/telemetry` / `GET /api/alerts` against the
   configured API base URL.
3. `server/index.js` routes the request to `server/live.js`, which reads the
   current `Drone` rows via Prisma and synthesizes telemetry/alert objects.
4. The native map (`FleetMap`) and alert list (`AlertRow`) re-render with the
   fresh data; errors surface through the shared `RequestState` components.

---

## Tech Stack

### Mobile App (root)
| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 58) + React Native 0.88 |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, with `(tabs)` groups and dynamic routes) |
| Language | TypeScript |
| UI | Custom theme system (`lib/theme.ts`, `lib/theme-context.tsx`), no third-party UI kit |
| Maps | `react-native-maps` |
| 3D rendering | `three`, `expo-three`, `expo-gl` |
| Icons | `@expo/vector-icons` |
| Fonts | `@expo-google-fonts/outfit`, `@expo-google-fonts/jetbrains-mono` |
| Storage | `@react-native-async-storage/async-storage` (session persistence) |
| Images | `expo-image-picker`, `expo-file-system`, `expo-asset` |

### Backend (`server/`)
| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | [Express 5](https://expressjs.com/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Database | PostgreSQL (configured for a pooled/serverless provider — see `directUrl`/`url` split in the Prisma datasource) |
| Auth | `jsonwebtoken` (JWT) + `bcryptjs` (password hashing) |
| Uploads | `multer` (in-memory, converted to data URIs — no external bucket needed) |
| CORS | `cors` |
| Deployment target | Vercel serverless functions (`server/vercel.json`, `server/eas.json`) |

---

## Project Structure

```
vanaris/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom tab bar layout
│   │   ├── index.tsx           # Home — live map + telemetry + alerts
│   │   ├── drones.tsx          # Fleet roster list
│   │   ├── notifications.tsx   # Alert history
│   │   └── profile.tsx         # Account settings, theme toggle
│   ├── alert/[id].tsx          # Alert detail
│   ├── drone/[id].tsx          # Drone detail + 3D model viewer
│   ├── drone-form.tsx          # Create/edit drone form
│   ├── login.tsx / register.tsx
│   ├── index.tsx               # Entry/redirect screen
│   └── _layout.tsx             # Root layout (providers: theme, auth)
│
├── components/                 # Shared presentational components
│   ├── FleetMap.tsx             # Native map rendering drone markers
│   ├── DroneModel.tsx           # three.js/.glb 3D viewer
│   ├── TelemetryCard.tsx
│   ├── AlertRow.tsx
│   ├── StatusBadge.tsx
│   ├── PillTabBar.tsx
│   ├── SlideToStart.tsx
│   ├── PasswordField.tsx / PasswordStrengthMeter.tsx
│   ├── RequestState.tsx         # LoadingList / EmptyState / ErrorState
│   └── Screen.tsx               # Shared screen chrome + pull-to-refresh
│
├── lib/                         # Client-side logic, framework-agnostic
│   ├── api.ts                   # Typed fetch client for the Vanaris API
│   ├── auth-context.tsx         # Session state + token persistence
│   ├── theme.ts / theme-context.tsx
│   ├── password.ts              # Password-strength scoring
│   ├── useFetch.ts              # Polling data-fetch hook
│   └── time.ts
│
├── assets/                      # App icons, splash screens
├── scripts/                     # Project automation scripts
├── app.json / eas.json          # Expo config + EAS build config
├── metro.config.js
│
└── server/                      # Backend API
    ├── index.js                 # Express app + route mounting + error handler
    ├── live.js                  # Telemetry/alert derivation from drone data
    ├── data.js                  # Static spec sheet data
    ├── routes/
    │   ├── auth.js               # /api/auth/* — register, login, me
    │   └── drones.js              # /api/drones/* — CRUD
    ├── lib/
    │   ├── auth.js                # JWT signing/verification, auth middleware
    │   ├── prisma.js              # Prisma client singleton
    │   └── upload.js               # multer config + data-URI helper
    ├── models/
    │   └── drone_firefighter.glb   # 3D asset served to the client
    ├── prisma/
    │   ├── schema.prisma           # User + Drone models
    │   └── seed.js
    └── vercel.json / eas.json      # Deployment config
```

---

## Data Model

Defined in [`server/prisma/schema.prisma`](server/prisma/schema.prisma):

### `User`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `username` | `String` | Unique |
| `passwordHash` | `String` | bcrypt hash, never returned to the client |
| `displayName` | `String` | |
| `avatar` | `String?` | Data URI of the uploaded avatar |
| `createdAt` | `DateTime` | |

### `Drone`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `name` | `String` | |
| `tagline` | `String` | Short description shown in list/detail views |
| `status` | `String` | Defaults to `standby`; drives the status badge color |
| `badge` | `String?` | Optional secondary label |
| `image` | `String?` | Data URI of the uploaded photo |
| `model` | `String` | Defaults to `drone_firefighter.glb`, the 3D asset filename |
| `createdAt` / `updatedAt` | `DateTime` | |

Telemetry and alerts are **not** separate tables — they are computed on
request in `server/live.js` from the current set of `Drone` rows, so there is
no telemetry history to migrate or clean up, and the live feed can never
drift out of sync with the roster.

---

## API Reference

Base path: `/api`. All request/response bodies are JSON unless noted.

### Auth — `/api/auth`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| `POST` | `/register` | — | `{ username, password, displayName }` | Creates a user. Password must be 8+ chars with upper, lower, and a digit. Returns `{ token, user }`. |
| `POST` | `/login` | — | `{ username, password }` | Returns `{ token, user }`. |
| `GET` | `/me` | Bearer token | — | Returns the current user's public profile. |
| `PUT` | `/me` | Bearer token | `multipart/form-data`: `displayName?`, `password?`, `avatar?` (file) | Updates profile; re-hashes password if provided. |

### Drones — `/api/drones`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| `GET` | `/` | — | — | Lists all drones, oldest first. |
| `GET` | `/:id` | — | — | Fetches a single drone or `404`. |
| `POST` | `/` | Bearer token | `multipart/form-data`: `name`, `tagline`, `status?`, `badge?`, `image?` (file) | Creates a drone. |
| `PUT` | `/:id` | Bearer token | `multipart/form-data`, all fields optional | Partially updates a drone. |
| `DELETE` | `/:id` | Bearer token | — | Deletes a drone and drops its live telemetry. Returns `204`. |

### Live Data

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/telemetry` | Telemetry snapshot for every drone. |
| `GET` | `/api/telemetry/:droneId` | Telemetry for one drone, or `404`. |
| `GET` | `/api/alerts` | Current alert feed. |
| `GET` | `/api/alerts/:id` | A single alert, or `404`. |

### Specs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/specs` | Static spec-sheet reference data. |
| `GET` | `/api/specs/:id` | A single spec entry, or `404`. |

### Error Shape

All error responses look like:

```json
{ "error": "Human-readable message" }
```

A `503` specifically means the database is temporarily unreachable (e.g. a
serverless Postgres instance waking from idle) — the client should retry
rather than treat it as a permanent failure.

---

## Mobile App Screens

| Route | Screen | Purpose |
|---|---|---|
| `/` | Splash/redirect | Routes to `/login` or `/(tabs)` based on session state. |
| `/login` | Login | Username/password sign-in. |
| `/register` | Register | Account creation with live password strength feedback. |
| `/(tabs)` → Home | Fleet overview | Live map, telemetry cards, recent alerts. |
| `/(tabs)/drones` | Fleet roster | Full drone list with status badges; add/edit/delete. |
| `/(tabs)/notifications` | Alerts | Full alert history. |
| `/(tabs)/profile` | Profile | Edit display name/password/avatar, toggle theme, sign out. |
| `/drone/[id]` | Drone detail | Spec sheet + interactive 3D model viewer. |
| `/alert/[id]` | Alert detail | Full context for a single alert. |
| `/drone-form` | Drone form | Shared create/edit form (image upload included). |

---

## Authentication & Security

- Passwords are hashed with **bcrypt** (`bcryptjs`) before storage — plaintext
  passwords are never persisted.
- Sessions are **stateless JWTs** signed server-side; the mobile app stores
  the token locally and attaches it as `Authorization: Bearer <token>` on
  every authenticated request.
- Mutating drone endpoints (`POST`/`PUT`/`DELETE`) require a valid token via
  `authMiddleware`; read endpoints (`GET`) are public so the fleet map works
  even for signed-out viewers.
- Password policy is enforced on both the client (live strength meter) and
  the server (`passwordError()` in `routes/auth.js`), so the rule can never
  be bypassed by skipping client-side validation.
- Uploaded images (avatars, drone photos) are stored as base64 **data URIs**
  directly on the row — there is no external object-storage dependency, and
  no signed-URL surface to misconfigure.
- The server distinguishes **expected** failures (bad input, not found,
  unauthorized) from **infrastructure** failures (database unreachable) and
  returns the right HTTP status for each, instead of leaking stack traces to
  the client.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A PostgreSQL database (a serverless provider such as Neon works well with
  the `url` / `directUrl` split already in `schema.prisma`)
- Expo Go app (for quick device testing) or Android Studio / Xcode for
  native builds

### Backend Setup

```bash
cd server
npm install

# create server/.env — see Environment Variables below
npx prisma migrate deploy   # or: npx prisma db push
npx prisma db seed          # optional: seed demo data

npm start                   # or: node index.js
# API now listening on http://localhost:4000
```

### Mobile App Setup

```bash
# from the project root
npm install

npx expo start
# press "a" for Android, "i" for iOS, "w" for web, or scan the QR code
# with Expo Go
```

Point the app at your running API by configuring the base URL consumed in
`lib/api.ts` (e.g. via an Expo public environment variable) so the client
knows where `server/` is deployed during development.

### Common Tasks

| Task | Command |
|---|---|
| Start Expo dev server | `npm start` |
| Run on Android | `npm run android` |
| Run on iOS | `npm run ios` |
| Run on web | `npm run web` |
| Start API locally | `cd server && node index.js` |
| Run Prisma migrations | `cd server && npx prisma migrate dev` |
| Open Prisma Studio (inspect DB) | `cd server && npx prisma studio` |

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled/proxied Postgres connection string used at runtime. |
| `CONNECTION_URL` | Yes | Direct (non-pooled) Postgres connection string, used by Prisma for migrations. |
| `JWT_SECRET` | Yes | Secret used to sign/verify auth tokens. Use a long, random value. |
| `PORT` | No | Defaults to `4000`. Ignored on Vercel, which manages the port itself. |

`server/.env` is intentionally git-ignored — never commit real credentials.
Copy the table above into your own `server/.env` before running the API.

### Mobile App

The Expo client needs to know the API's base URL in `lib/api.ts`. In
development this is typically your machine's LAN IP and port
(`http://192.168.x.x:4000`); in production it should point at the deployed
API (see [Deployment](#deployment)).

---

## Deployment

- **API** — configured for [Vercel](https://vercel.com) serverless
  deployment via `server/vercel.json`; `server/index.js` exports the Express
  `app` directly so Vercel can import it as a request handler, and only
  binds a local port when run directly (`node index.js`).
- **Mobile App** — configured for [EAS Build](https://docs.expo.dev/build/introduction/)
  via `eas.json`, targeting standalone Android/iOS builds. Android uses an
  adaptive icon (background/foreground/monochrome layers) and a dark
  (`#0a0a0c`) splash screen, matching the app's dark-first theme.

---

## Design System

- **Dark-first UI** (`userInterfaceStyle: dark` in `app.json`) with a full
  light/dark theme pair driven by `lib/theme.ts` + `lib/theme-context.tsx`,
  so every screen and component reads colors from the active theme instead
  of hardcoding values.
- **Typography**: Outfit for display/body text, JetBrains Mono for
  numeric/telemetry readouts, loaded via `@expo-google-fonts`.
- **Consistent data states**: every list-driven screen uses the same
  `LoadingList` / `EmptyState` / `ErrorState` trio from
  `components/RequestState.tsx`, so loading, empty, and failure UX never
  diverges screen to screen.
- **Status language**: a single `StatusBadge` component maps a drone's
  `status` string to one consistent color/label everywhere it appears.

---

## Roadmap Ideas

These are not yet implemented, listed here for context on where the product
is headed rather than as a commitment:

- Push notifications for new alerts instead of poll-based discovery.
- Role-based accounts (operator vs. admin) rather than a single flat `User`.
- Historical telemetry storage for post-incident review and trend charts.
- Multi-fleet / multi-organization support.

---

## License

No license has been declared for this project yet. All rights reserved by
the project owner until a license file is added.
