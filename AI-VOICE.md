# AI Voice — OpenAI TTS

Language Studio now prefers OpenAI text-to-speech and automatically falls back to the browser voice if the AI endpoint is unavailable.

## Model and voices

- Model: `gpt-4o-mini-tts-2025-12-15`
- English default voice: `marin`
- Japanese default voice: `cedar`
- Output: MP3
- Local server caches generated MP3 files under `.cache/tts/`

The prompt asks for natural, warm, conversational pronunciation and adjusts the speaking style for the app's Slow / Medium / Natural choices.

## Security

Never put the OpenAI API key in:
- `app.js`
- `ai-tts.js`
- HTML
- GitHub
- a screenshot or chat message

The key belongs only in `.env.local` on the machine running the backend.

`.env.local` is ignored by Git.

## First-time setup on Windows

1. Run `git pull`.
2. Double-click `SETUP-AI-VOICE.bat`.
3. Paste your OpenAI API key into the hidden prompt.
4. Close any running Language Studio server.
5. Double-click `RUN-WINDOWS.bat` again.

The console should show:

```text
AI Voice: ENABLED - gpt-4o-mini-tts / English voice: marin
```

When AI Voice is active, lessons show:

```text
✨ AI-generated voice
```

The label is intentional: OpenAI requires clear disclosure that the generated TTS voice is AI-generated, not a human voice.

## Phone on the same Wi-Fi

Run `RUN-LAN-WINDOWS.bat`.

Because the phone calls the PC server, the API key still remains on the PC and is never sent to browser JavaScript.

## Fallback

If:
- the API key is missing,
- OpenAI is temporarily unavailable,
- the local API call fails,

the app automatically uses the browser's built-in SpeechSynthesis voice.

## Caching and API usage

The first request for a sentence may call OpenAI.

The generated MP3 is cached on the server using a hash of:
- model
- voice
- language
- pace
- exact text

Playing the exact same sentence again with the same settings reuses the cached MP3 instead of paying for a new TTS generation.

## Internet-hosted phone version

Do not put the API key into a GitHub Pages frontend.

For use from any phone anywhere, deploy a secure server-side or edge TTS endpoint and set:

```js
window.LANGUAGE_STUDIO_TTS_ENDPOINT = "https://YOUR-SERVER/api/tts";
```

The frontend is already designed for this. The secure cloud backend is a separate deployment step.


## Shared cross-device cache

The app now uses a deterministic cache key based on:

```text
model | profile | voice | language | pace | exact text
```

Current profile: `teacher-v1`.

The browser checks `audio/tts/<hash>.mp3` before contacting any dynamic TTS backend.

On the local Windows server:
- cache hit → static MP3, zero OpenAI request
- cache miss → one OpenAI request, then the MP3 is written to `audio/tts/`

Run `PUBLISH-AUDIO-CACHE.bat` to publish newly generated MP3s to GitHub.

On a public static HTTPS deployment, a missing MP3 falls back to browser TTS and does not automatically spend OpenAI credit.
