import fs from "fs";
const src = process.argv[2];

if (!src) {
  console.error("Usage: node scripts/use-env.mjs <sourceEnvFile>");
  process.exit(1);
}

if (!fs.existsSync(src)) {
  console.error(`Source env file not found: ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, ".env");
console.log(`Copied ${src} -> .env`);