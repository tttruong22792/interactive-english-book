import { rm, mkdir, copyFile, cp, readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

async function exists(path) {
  try { await access(path); return true; }
  catch { return false; }
}

async function copy(relative) {
  const from = join(root, relative);
  const to = join(dist, relative);
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["index.html","styles.css","manifest.webmanifest","sw.js"]) {
  await copy(file);
}

if (await exists(join(root, "icons"))) {
  await cp(join(root, "icons"), join(dist, "icons"), { recursive: true });
}

if (await exists(join(root, "audio"))) {
  await cp(join(root, "audio"), join(dist, "audio"), { recursive: true });
}

const indexSource = await readFile(join(root, "data/content-index.js"), "utf8");
const sourceMatches = [...indexSource.matchAll(/source:\s*"([^"]+\.js)"/g)]
  .map(match => match[1].replace(/^\.\//, ""));

const runtimeFiles = [
  "data/content-index.js",
  "data/content-loader.js",
  "platform-data.js",
  "catalog.js",
  "ai-tts.js",
  ...sourceMatches,
  "app.js"
];

const uniqueFiles = [...new Set(runtimeFiles)];
const runtimeParts = ["window.__LS_RUNTIME_STARTED = true;"];

for (const relative of uniqueFiles) {
  const source = await readFile(join(root, relative), "utf8");
  runtimeParts.push("\n// ===== " + relative + " =====\n" + source);
}

await writeFile(join(dist, "runtime.js"), runtimeParts.join("\n"), "utf8");
await writeFile(join(dist, ".nojekyll"), "", "utf8");

console.log("Built static site:", dist);
console.log("Runtime files:", uniqueFiles.length);
console.log("Shared audio directory copied:", await exists(join(root, "audio/tts")));
