import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devi.jewellers.goldrates",
  appName: "Devi Jewellers",
  webDir: "dist/public",
  bundledWebRuntime: false,
  // By default the Android app loads the bundled web assets from webDir.
  // Use `npm run android:env:public` (or `node scripts/set-cap-url.mjs <url>`) to
  // point the app at a remote server for live content.
  server: {
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
