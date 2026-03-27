import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.goldrates",
  appName: "GoldRatesApp",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    // Use your static IP and port for external network access
    url: "http://192.168.1.83:3000",
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;