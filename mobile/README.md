# MediCore System Guide

This is the main and only README for the current workspace.

README location:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\README.md](C:/Users/LOQ/Documents/TH_mobile_app/mobile/README.md)

## What This System Is

MediCore is a pharmacy operations system with:
- a React Native + Expo mobile client
- a Node.js + Express backend API
- MongoDB Atlas as the database

The mobile app talks to the backend through REST APIs under `/api/v1`.

## Workspace Structure

Current workspace root:

```text
TH_mobile_app/
├─ backend/
├─ mobile/
├─ scripts/
├─ uploads/
├─ .gitignore
├─ package.json
└─ package-lock.json
```

### Folder Purpose

- `backend/`
  API server, auth, business logic, database models, validations, uploads API.
- `mobile/`
  Expo app, screens, feature modules, theme system, navigation, shared UI.
- `scripts/`
  QA smoke scripts and data helpers.
- `uploads/`
  Filesystem storage root used by the backend uploads module.

## High-Level System Logic

### 1. Backend startup

Backend entry file:
- [C:\Users\LOQ\Documents\TH_mobile_app\backend\server.js](C:/Users/LOQ/Documents/TH_mobile_app/backend/server.js)

What it does:
- loads the Express app
- loads environment config
- starts the HTTP server
- connects to MongoDB Atlas
- supports graceful shutdown

Main Express app:
- [C:\Users\LOQ\Documents\TH_mobile_app\backend\src\app.js](C:/Users/LOQ/Documents/TH_mobile_app/backend/src/app.js)

What it does:
- enables CORS
- enables JSON body parsing
- exposes health and readiness endpoints
- mounts all `/api/v1/*` routes
- uses database-ready middleware before business routes
- uses not-found and error-handler middleware

### 2. Mobile startup

Mobile root layout:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\_layout.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/_layout.tsx)

What it does:
- loads app providers
- applies the navigation theme
- controls the status bar
- renders the Expo Router stack

Providers:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\src\providers\AppProviders.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/src/providers/AppProviders.tsx)

What they do:
- `SafeAreaProvider` for mobile safe areas
- `ThemeProvider` for light/dark/system theme
- `WebInputStyleReset` for clean web input rendering
- `QueryClientProvider` for React Query data fetching and caching
- auth bootstrap on app startup

### 3. Auth/session flow

Auth bootstrap hook:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\src\features\auth\hooks\useAuthBootstrap.ts](C:/Users/LOQ/Documents/TH_mobile_app/mobile/src/features/auth/hooks/useAuthBootstrap.ts)

Auth store:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\src\store\auth-store.ts](C:/Users/LOQ/Documents/TH_mobile_app/mobile/src/store/auth-store.ts)

How auth works:
1. app starts
2. saved session is loaded from secure storage
3. if a refresh token exists, the app calls refresh
4. if refresh succeeds, session is restored
5. if refresh fails with auth errors, session is cleared
6. protected tab layout opens only for authenticated users

Login screen:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(auth)\login.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(auth)/login.tsx)

### 4. Tab navigation and role handling

Tabs layout:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(tabs)\_layout.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(tabs)/_layout.tsx)

How it works:
- waits for auth bootstrap
- redirects unauthenticated users to login
- checks role access for tabs
- shows only the tabs allowed for the current role

Main mobile tabs:
- `dashboard`
- `medicines`
- `inventory`
- `sales`
- `more`

The `more` area contains secondary modules like:
- suppliers
- purchases
- reports
- users
- reviews
- theme/settings access

## Backend Module Structure

Backend modules are here:
- [C:\Users\LOQ\Documents\TH_mobile_app\backend\src\modules](C:/Users/LOQ/Documents/TH_mobile_app/backend/src/modules)

Current backend modules:
- `auth`
- `dashboard`
- `inventory`
- `medicines`
- `purchases`
- `reports`
- `reviews`
- `sales`
- `suppliers`
- `uploads`
- `users`

Typical backend module pattern:

```text
module/
├─ controllers/
├─ routes/
├─ services/
├─ repositories/
├─ models/
├─ validators/
├─ utils/
└─ index.js
```

Meaning:
- `controllers`: HTTP request/response handlers
- `routes`: Express route declarations
- `services`: business logic
- `repositories`: database queries and aggregations
- `models`: Mongoose schemas/models
- `validators`: request validation rules
- `utils`: normalization, access rules, helpers

## Mobile App Structure

Mobile app folders:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app)
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\src](C:/Users/LOQ/Documents/TH_mobile_app/mobile/src)

### `mobile/app`

This is the route layer used by Expo Router.

Examples:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(auth)\login.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(auth)/login.tsx)
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(tabs)\dashboard.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(tabs)/dashboard.tsx)
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(tabs)\sales\checkout.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(tabs)/sales/checkout.tsx)

These route files stay thin and connect to feature screens.

### `mobile/src`

This is the real application code.

Main folders:
- `api/`
- `components/`
- `constants/`
- `features/`
- `hooks/`
- `navigation/`
- `providers/`
- `store/`
- `theme/`
- `utils/`

### `mobile/src/features`

Feature-first structure.

Current mobile features:
- `auth`
- `dashboard`
- `inventory`
- `medicines`
- `purchases`
- `reports`
- `reviews`
- `sales`
- `suppliers`
- `users`

Typical mobile feature pattern:

```text
feature/
├─ api/
├─ components/
├─ hooks/
├─ screens/
├─ store/        (only where needed)
├─ types/
└─ utils/
```

Meaning:
- `api`: requests to backend endpoints
- `components`: feature-specific UI blocks
- `hooks`: data fetching and mutations
- `screens`: actual screen components
- `store`: feature-local client state if needed
- `types`: TypeScript contracts
- `utils`: formatting, forms, validation helpers

## Main Business Flows

### Authentication
- login with email and password
- refresh persisted session
- logout
- role-aware protected navigation

### Dashboard
- summary counts
- sales summary
- low stock indicators
- role-specific quick information

### Medicines
- list medicines
- search medicines
- view medicine detail
- add medicine
- edit medicine
- expiry visibility

### Inventory
- stock list
- low stock
- expiry stock
- stock movements
- stock by medicine
- add stock
- adjust stock

### Sales / POS
- search/select medicine
- build cart
- checkout
- sale history
- sale detail

### Suppliers
- list suppliers
- add supplier
- edit supplier
- supplier detail

### Purchases
- list purchases
- create purchase
- receive purchase
- purchase detail

### Reports
- date and filter driven report screens

### Users
- list staff/users
- add user
- edit user
- detail view
- status changes

### Reviews
- list reviews
- create review
- edit review
- detail view

## How Data Flows

Normal request flow:

```text
Mobile Screen
→ Feature Hook
→ Feature API file
→ Axios client
→ Backend route
→ Controller
→ Service
→ Repository / Model
→ MongoDB Atlas
```

Normal response flow:

```text
MongoDB Atlas
→ Repository / Model
→ Service
→ Controller
→ API response
→ Mobile API file
→ React Query cache
→ Screen re-render
```

## Important Files

### Mobile

- main mobile README:
  [C:\Users\LOQ\Documents\TH_mobile_app\mobile\README.md](C:/Users/LOQ/Documents/TH_mobile_app/mobile/README.md)
- mobile package:
  [C:\Users\LOQ\Documents\TH_mobile_app\mobile\package.json](C:/Users/LOQ/Documents/TH_mobile_app/mobile/package.json)
- mobile env example:
  [C:\Users\LOQ\Documents\TH_mobile_app\mobile\.env.example](C:/Users/LOQ/Documents/TH_mobile_app/mobile/.env.example)
- login screen:
  [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(auth)\login.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(auth)/login.tsx)
- tab shell:
  [C:\Users\LOQ\Documents\TH_mobile_app\mobile\app\(tabs)\_layout.tsx](C:/Users/LOQ/Documents/TH_mobile_app/mobile/app/(tabs)/_layout.tsx)

### Backend

- backend entry:
  [C:\Users\LOQ\Documents\TH_mobile_app\backend\server.js](C:/Users/LOQ/Documents/TH_mobile_app/backend/server.js)
- backend app:
  [C:\Users\LOQ\Documents\TH_mobile_app\backend\src\app.js](C:/Users/LOQ/Documents/TH_mobile_app/backend/src/app.js)
- backend env example:
  [C:\Users\LOQ\Documents\TH_mobile_app\backend\.env.example](C:/Users/LOQ/Documents/TH_mobile_app/backend/.env.example)
- ensure admin script:
  [C:\Users\LOQ\Documents\TH_mobile_app\backend\scripts\ensure-admin.js](C:/Users/LOQ/Documents/TH_mobile_app/backend/scripts/ensure-admin.js)

## Environment Files

### Backend env

Backend env file:
- [C:\Users\LOQ\Documents\TH_mobile_app\backend\.env](C:/Users/LOQ/Documents/TH_mobile_app/backend/.env)

Main values:
- `PORT`
- `API_PREFIX`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `CORS_ORIGINS`
- upload settings

### Mobile env

Mobile env file:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\.env](C:/Users/LOQ/Documents/TH_mobile_app/mobile/.env)

Main value:
- `EXPO_PUBLIC_API_BASE_URL`

Examples:
- Android emulator: `http://10.0.2.2:5001/api/v1`
- local web: `http://127.0.0.1:5001/api/v1`
- physical device: `http://YOUR-LAN-IP:5001/api/v1`

## Running On Another Machine

### Backend

```powershell
cd backend
npm install
npm run ensure:admin
npm start
```

### Mobile

```powershell
cd mobile
npm install
npx expo start
```

### Admin login

Default admin from the current setup:
- email: `admin@medicore.com`
- password: `admin123`

## Smoke Checks

### Workspace-level

```powershell
npm run smoke
```

### Mobile-only

```powershell
cd mobile
npm run typecheck
```

## Summary

This workspace now uses:
- one backend
- one mobile app
- one feature-first mobile architecture
- one modular backend architecture
- one remaining README file for system understanding

If you need a new developer to understand the system quickly, start with this file:
- [C:\Users\LOQ\Documents\TH_mobile_app\mobile\README.md](C:/Users/LOQ/Documents/TH_mobile_app/mobile/README.md)
