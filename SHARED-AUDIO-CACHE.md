# Shared Audio Cache — cost-safe design

Goal: generate OpenAI TTS at most once for the same exact combination of:
- model
- voice
- language
- pace
- text

## Cache key

SHA256(model | profile | voice | language | pace | exact text)

Current fixed profile:
- model: gpt-4o-mini-tts-2025-12-15
- profile: teacher-v1
- English voice: marin
- Japanese voice: cedar

## Playback order

1. Browser checks audio/tts/<hash>.mp3.
2. If it exists, play it immediately. No OpenAI API request.
3. If it does not exist and the app is running on localhost/private LAN, call /api/tts once.
4. The Windows server saves the result directly to audio/tts/<hash>.mp3.
5. Future plays on that PC use the static MP3.
6. Run PUBLISH-AUDIO-CACHE.bat to push only those MP3 files to GitHub.
7. Online deployments reuse the same MP3 files on every phone/computer.

## Public online mode

Public HTTPS static hosting does NOT call OpenAI by default.

If a shared MP3 exists:
- AI voice plays.

If it does not exist:
- app falls back to browser TTS.
- no OpenAI credit is spent.

A future secure cloud TTS backend can be explicitly configured with:

window.LANGUAGE_STUDIO_TTS_ENDPOINT = "https://your-secure-backend/api/tts";

Do not put an OpenAI API key in browser JavaScript.

## Why audio/tts is tracked

The old .cache/tts directory was device-local only.
The new audio/tts directory is the cross-device cache and is intentionally committed.

Only publish audio you actually generated or deliberately pre-generated.
This avoids bulk-generating hundreds of sentences nobody has listened to.
