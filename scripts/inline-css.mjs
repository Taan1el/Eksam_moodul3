import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const assets = path.join(dist, "assets");
const cssFile = fs.readdirSync(assets).find((name) => /^main-.*\.css$/.test(name));

if (!cssFile) {
  throw new Error("Built stylesheet was not found");
}

const cssPath = path.join(assets, cssFile);
const css = fs.readFileSync(cssPath, "utf8");
const stylesheetPattern = /<link rel="stylesheet" crossorigin href="[^"]*main-[^"]+\.css">/;

for (const name of fs.readdirSync(dist)) {
  if (!name.endsWith(".html")) continue;
  const file = path.join(dist, name);
  const html = fs.readFileSync(file, "utf8");
  if (!stylesheetPattern.test(html)) {
    throw new Error(`Stylesheet link was not found in ${name}`);
  }
  fs.writeFileSync(file, html.replace(stylesheetPattern, `<style>${css}</style>`));
}
