import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devi.jewellers.goldrates",
  appName: "Devi Jewellers",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    // By default we load the bundled web assets (recommended).
    // Use scripts/set-cap-url.mjs if you want to load the UI remotely.
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;