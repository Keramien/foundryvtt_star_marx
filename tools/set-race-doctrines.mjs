// One-shot override of `system.doctrinesAutorisees` for selected races.
// Edit the UPDATES map then re-run. Useful when the narrative recommendation
// changes without otherwise touching the race data.

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const DIR  = join(ROOT, "packs-src", "races");

// slug (filename without .json) -> { marteau, faucille, etoile } bools
const UPDATES = {
  gigolbare: { marteau: false, faucille: true,  etoile: false },
  gonklin:   { marteau: true,  faucille: false, etoile: true  },
  krolik:    { marteau: true,  faucille: false, etoile: true  },
  simple:    { marteau: true,  faucille: true,  etoile: false },
  gusano:    { marteau: true,  faucille: false, etoile: true  }
};

for (const [slug, doctrines] of Object.entries(UPDATES)) {
  const file = join(DIR, `${slug}.json`);
  const doc = JSON.parse(readFileSync(file, "utf8"));
  doc.system.doctrinesAutorisees = doctrines;
  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  const allowed = Object.entries(doctrines).filter(([, v]) => v).map(([k]) => k).join(", ");
  console.log(`  ${doc.name}: [${allowed}]`);
}

console.log(`Updated ${Object.keys(UPDATES).length} race(s).`);
