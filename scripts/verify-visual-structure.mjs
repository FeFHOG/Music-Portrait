import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("src/pages/index.astro", "utf8");
const scriptPath = "src/scripts/plotter-field.js";
const scriptExists = existsSync(scriptPath);
const script = scriptExists ? readFileSync(scriptPath, "utf8") : "";

const checks = [
  ["page uses plotter canvas", page.includes('id="plotter-canvas"')],
  ["page has separator strips", page.includes("separator-strip")],
  ["page has custom scrollbar", page.includes("site-scrollbar")],
  ["page imports plotter script", page.includes("../scripts/plotter-field.js")],
  ["plotter script exists", scriptExists],
  ["script exposes plotter drawing", script.includes("drawPlotterField")],
  ["script avoids pixel-field image generation", !script.includes("createImageData")],
  ["script uses pointer displacement", script.includes("pointerInfluence")],
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
