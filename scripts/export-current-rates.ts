import { storage } from "../server/storage";
import { writeCurrentRatesToFile } from "../server/currentratesfile";

const rates = await storage.getCurrentRates();

if (!rates) {
  throw new Error("No active rates found in database");
}

await writeCurrentRatesToFile(rates);
console.log("Wrote current rates to currentrates.txt");
