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
