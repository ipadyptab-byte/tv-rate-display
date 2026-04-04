import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devijewellers.tvrate",
  appName: "TV Rate Display",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    url: "https://displayrates.devi-jewellers.com",
    cleartext: false
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    backgroundsColor: "#ffffff"
  }
};

export default config;