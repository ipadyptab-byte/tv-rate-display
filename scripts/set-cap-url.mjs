import fs from "fs";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/set-cap-url.mjs <url>");
  console.error("Example: node scripts/set-cap-url.mjs http://192.168.1.100:3000");
  process.exit(1);
}

const cfgPath = "capacitor.config.ts";
if (!fs.existsSync(cfgPath)) {
  console.error("capacitor.config.ts not found. Did you run npm run android:init?");
  process.exit(1);
}

let src = fs.readFileSync(cfgPath, "utf8");

// Replace existing url: "..." inside server: { ... }
if (src.includes("server:")) {
  src = src.replace(/url:\s*\"[^\"]*\"/, `url: "${url}"`);
} else {
  // Insert a server block if missing (very unlikely in this project)
  src = src.replace(
    /const config: CapacitorConfig = \{/,
    `const config: CapacitorConfig = {\n  server: { url: "${url}", cleartext: true },`
  );
}

fs.writeFileSync(cfgPath, src, "utf8");
console.log(`Updated capacitor.config.ts server.url -> ${url}`);