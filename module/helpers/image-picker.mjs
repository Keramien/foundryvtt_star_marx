// Shared image picker helper for Star Marx sheets.
//
// Foundry's native FilePicker already provides the useful modal UX: browse
// assets, upload files, and pick an image. This helper only nudges it toward a
// Star Marx world folder and writes the selected path back to the document.

const DEFAULT_ACTOR_DIRS = {
  kamarade: "actors/kamarades",
  enemy: "actors/enemies",
  soyouz: "actors/soyouz"
};

const DEFAULT_ITEM_DIRS = {
  race: "items/races",
  signe: "items/signes",
  clef: "items/clefs",
  don: "items/dons",
  signe_soyouz: "items/signes-soyouz",
  kontrebande: "items/kontrebandes",
  barda: "items/barda",
  faiblesse: "items/faiblesses",
  atout: "items/atouts"
};

export async function openStarMarxImagePicker({ document, field = "img", position = {} } = {}) {
  if (!document?.update) return;
  if (!game.user?.can("FILES_BROWSE")) {
    ui.notifications.warn(game.i18n.localize("STARMARX.ImagePicker.NoBrowsePermission"));
    return;
  }

  const targetDir = targetDirectoryFor(document);
  const directoryReady = await ensureDirectory(targetDir);

  const current = foundry.utils.getProperty(document, field);
  const picker = new FilePicker({
    type: "image",
    current: shouldOpenCurrent(current) ? current : directoryReady ? targetDir : worldDirectory(),
    callback: async path => {
      await document.update({ [field]: path });
      ui.notifications.info(game.i18n.localize("STARMARX.ImagePicker.ImageUpdated"));
    },
    top: (position.top ?? 100) + 40,
    left: (position.left ?? 100) + 10
  });

  return picker.browse();
}

function targetDirectoryFor(document) {
  const base = `${worldDirectory()}/star-marx`;

  if (document.documentName === "Actor") {
    return `${base}/${DEFAULT_ACTOR_DIRS[document.type] ?? "actors"}`;
  }
  if (document.documentName === "Item") {
    return `${base}/${DEFAULT_ITEM_DIRS[document.type] ?? "items"}`;
  }
  return `${base}/images`;
}

function worldDirectory() {
  return `worlds/${game.world?.id ?? "world"}`;
}

function shouldOpenCurrent(current) {
  return typeof current === "string"
    && current.length > 0
    && !current.startsWith("icons/svg/");
}

async function ensureDirectory(targetDir) {
  if (!targetDir || !game.user?.can("FILES_UPLOAD")) return false;

  const parts = targetDir.split("/");
  for (let i = 3; i <= parts.length; i += 1) {
    const dir = parts.slice(0, i).join("/");
    try {
      await FilePicker.createDirectory("data", dir, {});
    } catch (err) {
      if (isExistingDirectoryError(err)) continue;
      console.warn("Star Marx | Could not create image directory", dir, err);
      ui.notifications.warn(game.i18n.format("STARMARX.ImagePicker.DirectoryFailed", { path: targetDir }));
      return false;
    }
  }
  return true;
}

function isExistingDirectoryError(err) {
  const message = String(err?.message ?? err).toLowerCase();
  return message.includes("eexist")
    || message.includes("already exists")
    || message.includes("file exists")
    || message.includes("existe");
}
