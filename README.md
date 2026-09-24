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

Pattern 02 and Pattern 03 use the reusable `sectioned-pattern` renderer and keep lesson content in `data/english/patterns/002.js` and `data/english/patterns/003.js`.


## AI Voice

Language Studio can now use OpenAI `gpt-4o-mini-tts` for more natural pronunciation.

First-time Windows setup:

```text
1. git pull
2. double-click SETUP-AI-VOICE.bat
3. paste the OpenAI API key into the hidden local prompt
4. restart RUN-WINDOWS.bat
```

The key is stored only in `.env.local`, which is ignored by Git. Never put the key in frontend JavaScript.

Default voices:
- English: `marin`
- Japanese: `cedar`

If AI Voice is unavailable, the app automatically falls back to browser TTS. Generated local audio is cached in `.cache/tts/`.

See `AI-VOICE.md`.


## Shared AI audio cache

Language Studio now reuses AI-generated MP3 files across PC and phone.

Playback order:
1. Check `audio/tts/<hash>.mp3`.
2. If it exists, play it with no OpenAI request.
3. On localhost/private LAN only, a cache miss calls OpenAI once.
4. The Windows server saves the MP3 directly into `audio/tts/`.
5. Run `PUBLISH-AUDIO-CACHE.bat` to push only those MP3 files.
6. Online static hosting reuses the published MP3 files on every device.

Public HTTPS static hosting does **not** call OpenAI automatically. If an MP3 has not been published, the app falls back to browser TTS instead of spending API credit.

The static deployment build is:

```text
npm run build
```

Output:

```text
dist/
```

See `SHARED-AUDIO-CACHE.md` and `ONLINE-DEPLOY.md`.
