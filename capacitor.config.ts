import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.goldrates",
  appName: "GoldRatesApp",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;