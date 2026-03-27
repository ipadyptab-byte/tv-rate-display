import fs from "fs";
import { spawnSync } from "node:child_process";

const hasConfig = [
  "capacitor.config.ts",
  "capacitor.config.js",
  "capacitor.config.json",
].some((f) => fs.existsSync(f));

if (hasConfig) {
  console.log("Capacitor config already exists. Skipping init.");
  process.exit(0);
}

const args = [
  "cap",
  "init",
  "GoldRatesApp",
  "com.example.goldrates",
  "--web-dir=dist/public",
];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status || 0);