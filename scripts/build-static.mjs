import { rm, mkdir, copyFile, cp, readFile, writeFile, access, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import vm from "node:vm";

const root = process.cwd();
const dist = join(root, "dist");

const TTS_MODEL_ID = "gpt-4o-mini-tts-2025-12-15";
const TTS_PROFILE = "teacher-v1";
const TTS_MASTER_PACE = "natural";

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

function normalizeText(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectLessonSentences(lesson) {
  const out = [];
  const seen = new Set();

  const add = (en, vi = "") => {
    if (typeof en !== "string") return;
    en = en.trim();
    vi = typeof vi === "string" ? vi.trim() : "";
    const key = normalizeText(en);
    if (!key || seen.has(key) || !/[a-z]/i.test(en) || /^\//.test(en)) return;
    seen.add(key);
    out.push({ en, vi });
  };

  const addPairs = (items) => (items || []).forEach((x) => {
    if (Array.isArray(x) && typeof x[0] === "string") add(x[0], x[1] || "");
  });

  addPairs(lesson?.introExamples);

  if (lesson?.layout === "sectioned-pattern") {
    (lesson.sections || []).forEach((section) => {
      (section.blocks || []).forEach((block) => {
        if (block?.type === "sentences") addPairs(block.items);
        if (block?.type === "dialogs") {
          (block.items || []).forEach((dialog) => {
            (dialog.rows || []).forEach((row) => add(row[1], row[2] || ""));
          });
        }
      });
    });
  } else {
    const u = lesson?.ui || {};
    const p = u.pronunciation || {};
    const comp = u.comparison || {};
    const q = u.questions || {};

    if (p.exampleSentence) add(p.exampleSentence, p.exampleMeaning || "");
    addPairs(p.contrastSentences);
    addPairs(comp.examples);
    if (Array.isArray(comp.homeSentence)) add(comp.homeSentence[0], comp.homeSentence[1] || "");
    if (Array.isArray(comp.publicSentence)) add(comp.publicSentence[0], comp.publicSentence[1] || "");
    addPairs(lesson?.sentences20);
    addPairs(lesson?.work);
    addPairs(lesson?.restaurantNouns);
    (lesson?.buildSteps || []).forEach((x) => Array.isArray(x) && add(x[1], x[2] || ""));
    (lesson?.dialogs || []).forEach((dialog) => {
      (dialog.rows || []).forEach((row) => add(row[1], row[2] || ""));
    });
    addPairs(lesson?.questions);
    addPairs(q.answers);
    if (u?.work?.calloutSentence) add(u.work.calloutSentence, u.work.calloutMeaning || "");
    if (u?.restaurant?.leftExample) add(u.restaurant.leftExample, "");
    if (u?.restaurant?.rightExample) add(u.restaurant.rightExample, "");
  }

  return out;
}

function collectLessonAudioExtras(lesson) {
  const out = [];
  const seen = new Set();

  const add = (text) => {
    if (typeof text !== "string") return;
    const value = text.trim();
    const key = normalizeText(value);
    if (!key || seen.has(key) || !/[a-z]/i.test(value)) return;
    seen.add(key);
    out.push(value);
  };

  (lesson?.sections || []).forEach((section) => {
    (section.blocks || []).forEach((block) => {
      if (block?.type === "chips") {
        (block.items || []).forEach((item) => {
          if (Array.isArray(item)) add(item[0]);
        });
      }
    });
  });

  return out;
}

function detectLanguage(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(text || "")) ? "ja-JP" : "en-US";
}

function voiceFor(language) {
  return /^ja/i.test(language || "") ? "cedar" : "marin";
}

function ttsHash(text, language, voice) {
  return createHash("sha256")
    .update([TTS_MODEL_ID, TTS_PROFILE, voice, language, TTS_MASTER_PACE, String(text)].join("|"), "utf8")
    .digest("hex");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["index.html", "styles.css", "manifest.webmanifest", "sw.js"]) {
  await copy(file);
}

if (await exists(join(root, "icons"))) {
  await cp(join(root, "icons"), join(dist, "icons"), { recursive: true });
}

const indexSource = await readFile(join(root, "data/content-index.js"), "utf8");
const sourceMatches = [...indexSource.matchAll(/source:\s*"([^"]+\.js)"/g)]
  .map((match) => match[1].replace(/^\.\//, ""));

const runtimeFiles = [
  "data/content-index.js",
  "data/content-loader.js",
  "data/english/core-dictionary.js",
  "data/english/tenses.js",
  "platform-data.js",
  "catalog.js",
  "ai-tts.js",
  ...sourceMatches,
  "app.js"
];

const uniqueFiles = [...new Set(runtimeFiles)];

// Guard against a recurring class of UI bugs:
// $() returns one Element; collection methods must use the collection selector helper.
const appSourceForGuard = await readFile(join(root, "app.js"), "utf8");
const badSingleSelectorCalls = [...appSourceForGuard.matchAll(/(?<!\$)\$\([^\n;]+\)\.(forEach|map|filter|some|every)\s*\(/g)]
  .map((match) => match[0]);
if (badSingleSelectorCalls.length) {
  throw new Error(
    "Invalid single-element selector used with a collection method. Use the collection selector helper instead:\n" +
    badSingleSelectorCalls.join("\n")
  );
}

const runtimeParts = [
  "window.__LS_RUNTIME_STARTED = true;",
  "window.LS_AUDIO_CACHE = new Set([]);"
];

for (const relative of uniqueFiles) {
  const source = await readFile(join(root, relative), "utf8");
  runtimeParts.push("\n// ===== " + relative + " =====\n" + source);
}

await writeFile(join(dist, "runtime.js"), runtimeParts.join("\n"), "utf8");
await writeFile(join(dist, "runtime-20260926-pattern009-commercial-v1.js"), runtimeParts.join("\n"), "utf8");

// Build an allow-list for cloud TTS. The Edge Function accepts only hashes
// present in this manifest, so arbitrary public text cannot trigger OpenAI.
const context = vm.createContext({ window: { CONTENT_REGISTRY: {} } });
{
  const tensesSource = await readFile(join(root, "data/english/tenses.js"), "utf8");
  vm.runInContext(tensesSource, context, { filename: "data/english/tenses.js" });
}
for (const relative of sourceMatches.filter((p) => p.startsWith("data/english/patterns/"))) {
  const source = await readFile(join(root, relative), "utf8");
  vm.runInContext(source, context, { filename: relative });
}

const entries = {};
for (const lesson of Object.values(context.window.CONTENT_REGISTRY || {})) {
  if (!lesson || lesson.language !== "en" || lesson.category !== "patterns") continue;
  const allowedAudio = [
    ...collectLessonSentences(lesson).map((item) => ({ text: item.en, kind: "sentence" })),
    ...collectLessonAudioExtras(lesson).map((text) => ({ text, kind: "phrase" }))
  ];

  for (const item of allowedAudio) {
    const language = detectLanguage(item.text);
    const voice = voiceFor(language);
    const hash = ttsHash(item.text, language, voice);
    const existing = entries[hash];
    if (existing) {
      if (!existing.lessonIds.includes(lesson.id)) existing.lessonIds.push(lesson.id);
      if (!existing.kinds.includes(item.kind)) existing.kinds.push(item.kind);
      continue;
    }
    entries[hash] = {
      text: item.text,
      language,
      voice,
      lessonIds: [lesson.id],
      kinds: [item.kind]
    };
  }
}


const guide = context.window.TENSES_GUIDE;
if (guide) {
  const addGuideAudio = (text, kind = "tense-guide") => {
    if (typeof text !== "string" || !text.trim()) return;
    const clean = text.trim();
    const language = detectLanguage(clean);
    const voice = voiceFor(language);
    const hash = ttsHash(clean, language, voice);
    const existing = entries[hash];
    if (existing) {
      if (!existing.lessonIds.includes("english-tenses-guide")) existing.lessonIds.push("english-tenses-guide");
      if (!existing.kinds.includes(kind)) existing.kinds.push(kind);
      return;
    }
    entries[hash] = {
      text: clean,
      language,
      voice,
      lessonIds: ["english-tenses-guide"],
      kinds: [kind]
    };
  };

  (guide.tenses || []).forEach((tense) => {
    (tense.examples || []).forEach((item) => Array.isArray(item) && addGuideAudio(item[0], "tense-example"));
  });

  (guide.keyContrasts || []).forEach((group) => {
    (group.examples || []).forEach((item) => Array.isArray(item) && addGuideAudio(item[0], "tense-contrast"));
  });

  (guide.practice || []).forEach((item) => addGuideAudio(item.answer, "tense-practice"));
}

const ttsManifest = {
  version: 1,
  modelIdentity: TTS_MODEL_ID,
  profile: TTS_PROFILE,
  masterPace: TTS_MASTER_PACE,
  generatedAt: new Date().toISOString(),
  count: Object.keys(entries).length,
  entries
};

await writeFile(join(dist, "tts-manifest.json"), JSON.stringify(ttsManifest), "utf8");
await writeFile(join(dist, ".nojekyll"), "", "utf8");

console.log("Built static site:", dist);
console.log("Runtime files:", uniqueFiles.length);
console.log("Cloud TTS allow-list sentences + phrases:", ttsManifest.count);
console.log("Audio delivery: Supabase Storage + per-device Cache Storage");
