# Language Studio — project context for Claude Code

## Product direction
This project is no longer limited to “80 English sentence patterns”.
It is a broader self-study language platform that can grow into:
- English sentence patterns
- English vocabulary
- English listening / speaking
- Japanese daily-life lessons
- Japanese workplace / school / hospital phrases
- personal vocabulary
- flashcards
- quizzes and progress

## Design direction
Modern education/product landing page:
- warm off-white background
- large editorial serif headings
- playful purple / green / yellow / orange accents
- modular cards
- generous spacing
- mobile-first responsive behavior

Do not copy another website pixel-for-pixel. Keep this product's own identity.

## Architecture
- `index.html` — shell and navigation
- `styles.css` — visual design system
- `platform-data.js` — tracks/modules and starter Japanese data
- `lesson01.js` — English Pattern 01 content + dictionary
- `catalog.js` — English pattern catalog
- `app.js` — routing, rendering, TTS, lookup, vocabulary, quiz, progress
- `manifest.webmanifest` + `sw.js` — PWA-ready files
- `START-ENGLISH-BOOK.ps1` — Windows local server
- `RUN-LAN-WINDOWS.bat` — same-Wi-Fi phone testing

## Rules
1. Keep lesson content separate from rendering logic.
2. Reuse rendering helpers.
3. Do not hard-code the whole product around 80 patterns.
4. Preserve click-to-hear, word lookup, phrase selection, saved vocabulary, quiz and progress.
5. Japanese audio should use ja-JP TTS.
6. Keep phone layouts first-class.
7. Avoid unnecessary frameworks until the content model stabilizes.
8. Never commit API keys, passwords, tokens, or personal secrets.

## Git
Main repo: `tttruong22792/interactive-english-book`


## Mobile / cross-device phase
The app now has a `#settings` route for:
- JSON export/import of learning state
- sharing the current page
- PWA install prompt
- showing local-device learning stats

Current progress is local-first. Do not imply automatic cloud synchronization until a backend/account system is actually implemented.

## Deployment
A GitHub Pages Actions workflow exists in `.github/workflows/pages.yml`.
Keep all static asset paths relative so the app works under a repository subpath.


## Content architecture v4 — IMPORTANT

Lesson content has moved out of root app files.

Use:
- `data/content-index.js` for lesson metadata
- `data/content-loader.js` for lazy loading
- `data/english/core-dictionary.js` for shared English word/phrase fallback
- `data/english/patterns/*.js` for English pattern content
- `data/japanese/**` for Japanese content
- `data/templates/` when creating new lessons

For a new lesson that uses an existing renderer, **do not edit app.js**.
Copy the correct template, add the lesson data file, then add metadata to the content index.

Progress is lesson-scoped. Preserve stable content IDs so saved progress continues to map correctly.

Read `CONTENT-SCHEMA.md` before adding learning content.

When adding a new English lesson:
- keep lesson-specific vocabulary in the lesson dictionary when useful;
- audit every clickable English word against the lesson dictionary + `CORE_DICTIONARY`;
- phrase/chip audio must remain separate from the lesson sentence/practice list.


## Current English pattern references
- Pattern 01: `data/english/patterns/001.js`
- Pattern 02: `data/english/patterns/002.js`
- Pattern 03: `data/english/patterns/003.js`
- Pattern 04: `data/english/patterns/004.js`
- Pattern 05: `data/english/patterns/005.js`
- Pattern 06: `data/english/patterns/006.js`

Patterns 02–06 demonstrate the reusable `sectioned-pattern` layout.


## AI Voice architecture

- `ai-tts.js` is the browser-side AI audio client.
- `START-ENGLISH-BOOK.ps1` exposes local `/api/tts` and `/api/tts/status`.
- OpenAI model: `gpt-4o-mini-tts`.
- English voice: `marin`.
- Japanese voice: `cedar`.
- Local MP3 cache: `.cache/tts/`.
- Browser SpeechSynthesis is the automatic fallback.

SECURITY RULE:
Never place `OPENAI_API_KEY` in frontend code, committed files, screenshots, logs, or documentation. The local key belongs only in the ignored `.env.local` file or a secure server environment variable.

For a future hosted/mobile-anywhere version, keep the same frontend contract and point `window.LANGUAGE_STUDIO_TTS_ENDPOINT` at a secure server-side/edge endpoint.
