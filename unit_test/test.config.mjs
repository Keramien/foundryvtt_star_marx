import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);
const repoRoot = path.resolve(thisDir, "..");

export const PATHS = {
  repoRoot,
  unitTestRoot: thisDir,
  signsSourceDir: path.join(repoRoot, "packs-src", "signes"),
  signsTestsDir: path.join(thisDir, "signs"),
  signsCatalogPath: path.join(thisDir, "meta", "signes-catalog.json")
};

export const SIGN_CATEGORIES = ["general", "trait", "racial", "race", "groupuscule"];
