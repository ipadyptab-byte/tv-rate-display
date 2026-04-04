import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.goldrates",
  appName: "GoldRatesApp",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    url: "https://displayrates.devi-jewellers.com/",
    allowNavigation: ["displayrates.devi-jewellers.com", "*.devi-jewellers.com"],
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;