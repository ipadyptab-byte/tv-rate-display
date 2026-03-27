import fs from "fs";

const url = process.argv[2];

const cfgPath = "capacitor.config.ts";
if (!fs.existsSync(cfgPath)) {
  console.error("capacitor.config.ts not found. Did you run npm run android:init?");
  process.exit(1);
}

let src = fs.readFileSync(cfgPath, "utf8");

const hasServerBlock = src.includes("server:");

if (!url) {
  // No URL provided: ensure we are using bundled assets (no server.url override).
  if (hasServerBlock) {
    // Remove a `url: "..."` line if present (with or without trailing comma).
    src = src.replace(/\n\s*url:\s*"[^"]*"\s*,?\s*/g, "\n");

    // Ensure cleartext stays enabled.
    if (!/cleartext:\s*true/.test(src)) {
      src = src.replace(/server:\s*\{/, "server: {\n    cleartext: true,");
    }
  } else {
    src = src.replace(
      /const config: CapacitorConfig = \{/, 
      "const config: CapacitorConfig = {\n  server: { cleartext: true },"
    );
  }

  fs.writeFileSync(cfgPath, src, "utf8");
  console.log("Cleared capacitor.config.ts server.url (using bundled assets)");
  process.exit(0);
}

// URL provided: set/update server.url to load from remote server.
if (hasServerBlock) {
  if (/url:\s*"[^"]*"/.test(src)) {
    src = src.replace(/url:\s*"[^"]*"/, `url: "${url}"`);
  } else {
    src = src.replace(/server:\s*\{/, `server: {\n    url: "${url}",`);
  }

  if (!/cleartext:\s*true/.test(src)) {
    src = src.replace(/server:\s*\{/, "server: {\n    cleartext: true,");
  }
} else {
  src = src.replace(
    /const config: CapacitorConfig = \{/, 
    `const config: CapacitorConfig = {\n  server: { url: "${url}", cleartext: true },`
  );
}

fs.writeFileSync(cfgPath, src, "utf8");
console.log(`Updated capacitor.config.ts server.url -> ${url}`);
