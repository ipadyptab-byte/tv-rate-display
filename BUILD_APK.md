# Build Android APK

This project is set up with Capacitor to package the Vite + Express app into a native Android app that points to your server.

## Prerequisites

- Node.js 18+ and npm
- Java JDK 17 (match Android Gradle Plugin requirements)
- Android Studio (latest), with SDK Platform and Build Tools installed
- A running PostgreSQL database (for the server API)
- Open network access to your server (or run server on the same device/emulator)

## 1) Configure environment

Create your environment file:

- For local development:
  - cp .env.local.example .env
  - Fill DATABASE_URL and keep PORT=3000
- For mobile build that should connect to your public/static IP:
  - The project includes .env.mobile which sets:
    - VITE_API_BASE_URL=http://103.159.153.24:3000
    - PORT=3000

You can modify .env.mobile if your host/port change.

## 2) Build web assets and prepare mobile env

- npm install
- npm run android:prep

This runs:
- npm run build (builds client to dist/public and server to dist/index.js)
- copies .env.mobile to .env so the app points to your public server

## 3) Initialize Capacitor (first time only)

- npm run android:init
- npm run android:add

This creates the Android project in android/.

## 4) Sync assets

Each time you rebuild the web app or change env:

- npm run android:sync

## 5) Open Android Studio and build APK

- npm run android:open
- In Android Studio:
  - Build > Build Bundle(s) / APK(s) > Build APK(s)
  - Find the APK in:
    - android/app/build/outputs/apk/debug/app-debug.apk (debug)
    - or configure signing for a release APK

## 6) Configure signing (release)

In Android Studio:
- Build > Generate Signed Bundle / APK...
- Create a keystore if needed
- Choose release, sign, and build
- The signed release APK will be saved under app/build/outputs/apk/release/

## 7) Pointing the app to your server

The mobile app talks to the server URL from two places:
- VITE_API_BASE_URL in .env.mobile (used by the web layer to make API calls)
- capacitor.config.ts `server.url` (controls what web content is loaded by the native app)

Defaults included:
- capacitor.config.ts points to http://103.159.153.24:3000 (cleartext enabled)
- .env.mobile sets VITE_API_BASE_URL=http://103.159.153.24:3000

Change these if you deploy behind HTTPS and/or a domain.

## 8) Troubleshooting

- White screen or network error on Android
  - Ensure the server is reachable from the device network
  - If using HTTP (not HTTPS), `cleartext: true` is set in capacitor.config.ts
- API CORS
  - Server includes CORS middleware. If you lock origins down, add your domain/app origin.
- File upload limits
  - Media upload limit is 50MB (server-side). Adjust if needed in server/routes.ts.