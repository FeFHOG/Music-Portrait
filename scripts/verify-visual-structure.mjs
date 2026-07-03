import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("src/pages/index.astro", "utf8");
const scriptPath = "src/scripts/spatial-field.js";
const scriptExists = existsSync(scriptPath);
const script = scriptExists ? readFileSync(scriptPath, "utf8") : "";

const checks = [
  ["page uses spatial canvas", page.includes('id="spatial-canvas"')],
  ["page no longer uses plotter canvas", !page.includes('id="plotter-canvas"')],
  ["page has folded stage", page.includes("fold-stage")],
  ["page has block panels", page.includes("block-panel")],
  ["page has custom scrollbar", page.includes("site-scrollbar")],
  ["page imports spatial script", page.includes("../scripts/spatial-field.js")],
  ["spatial script exists", scriptExists],
  ["script exposes spatial drawing", script.includes("drawSpatialField")],
  ["script avoids pixel-field image generation", !script.includes("createImageData")],
  ["script uses pointer displacement", script.includes("pointerBend")],
];

const failures = checks.filter(([, ok]) => !ok);

if (failures.length > 0) {
  console.error("Visual structure checks failed:");
  for (const [name] of failures) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log("Visual structure checks passed.");
