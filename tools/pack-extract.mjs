// Extract LevelDB compendia under packs/<pack> back to editable JSON under
// packs-src/<pack>/*.json. Useful for round-tripping edits made in Foundry's
// compendium UI.

import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const IN_DIR  = join(ROOT, "packs");
const OUT_DIR = join(ROOT, "packs-src");

function listPacks(dir) {
  try {
    return readdirSync(dir).filter(name => {
      try { return statSync(join(dir, name)).isDirectory(); }
      catch { return false; }
    });
  } catch { return []; }
}

const packs = listPacks(IN_DIR);
if (packs.length === 0) {
  console.log("No compiled packs to extract in", IN_DIR);
  process.exit(0);
}

for (const pack of packs) {
  const src = join(IN_DIR, pack);
  const dst = join(OUT_DIR, pack);
  console.log(`Star Marx | Extracting pack ${pack} → ${dst}`);
  await extractPack(src, dst, { log: true });
}

console.log("Star Marx | All packs extracted.");
