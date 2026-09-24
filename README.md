# Language Studio

A mobile-friendly self-study language platform for English + Japanese.

The project started from **80 English sentence patterns**, but is now structured to grow into vocabulary, listening, speaking, Japanese daily phrases, quizzes and progress tracking.

## Run on Windows
Double-click `RUN-WINDOWS.bat`.

## Test on your phone (same Wi-Fi)
1. PC and phone must be on the same Wi-Fi.
2. Double-click `RUN-LAN-WINDOWS.bat`.
3. If Windows Firewall asks, allow **Private networks**.
4. Open the printed phone URL, for example `http://192.168.1.20:5500/#home`.

LAN mode is ideal for testing the mobile layout and TTS. Microphone/PWA install on phones normally requires HTTPS. The next deployment step is an HTTPS host.

## Get updates from GitHub
```powershell
cd C:\Projects\interactive-english-book
git pull
```

## Main code files
- `index.html`
- `styles.css`
- `platform-data.js`
- `lesson01.js`
- `catalog.js`
- `app.js`
- `CLAUDE.md`

## Current learning features
- click sentence → hear sentence
- word click → IPA / meaning / example / hear / save
- select phrase → lookup
- saved vocabulary + flashcards
- sentence builder
- dialogue playback
- Vietnamese → English quiz
- speech recognition on supported browsers
- local progress
- Japanese starter phrase audio with ja-JP TTS


## Device data backup / transfer
Open **Thiết bị & dữ liệu** in the app:
- Export learning data to JSON
- Import the JSON on another device
- Share the current URL
- Install the PWA when served over HTTPS

This is the temporary cross-device method. Automatic cloud sync will be a later phase.

## GitHub Pages deployment
The repository includes `.github/workflows/pages.yml`, so the static site is ready for GitHub Pages deployment after Pages is enabled for the repository/account.
See `DEPLOY.md`.


## Content architecture v4

Learning content is now separated from the application engine:

```text
data/
├── content-index.js
├── content-loader.js
├── english/patterns/001.js
├── japanese/daily-life/001.js
└── templates/
```

To add another English pattern using the existing renderer, copy the template and add metadata to `data/content-index.js`. You do **not** need to edit `app.js`.

Progress keys are now scoped by lesson id, so future lessons do not overwrite Pattern 01 progress.

See `CONTENT-SCHEMA.md`.


## English content currently available

- Pattern 01 — **I’d like to…**
- Pattern 02 — **I’m going to…**
- Pattern 03 — **I want to…**
- Pattern 04 — **I plan to…**
- Pattern 05 — **I hope to…**

Patterns 02–05 use the reusable `sectioned-pattern` renderer.


## AI Voice and central audio

Language Studio uses OpenAI TTS with a central Supabase audio cache.

```text
GitHub Pages
    ↓
Device Cache Storage
    ↓ (cache miss)
Supabase Storage
    ↓ (object missing)
Supabase Edge Function
    ↓
OpenAI TTS
```

Central bucket:

```text
language-studio-audio/tts/<hash>.mp3
```

A sentence is generated at most once centrally. Each phone/computer downloads the MP3 once, stores it in its own Cache Storage, and reuses it on later plays.

Slow / Medium / Natural use one master MP3 with different playback rates.

OpenAI secrets are server-side only. Never put an API key in frontend JavaScript or GitHub.

See `AI-VOICE.md` and `SHARED-AUDIO-CACHE.md`.

## Static deployment

```text
npm run build
```

Output:

```text
dist/
```
