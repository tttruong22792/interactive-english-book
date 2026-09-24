# AI Voice — OpenAI TTS + Supabase central audio

Language Studio now uses a central audio architecture for online listening.

## Current architecture

- Frontend: GitHub Pages
- Central audio storage: Supabase Storage
- Bucket: `language-studio-audio`
- Cloud TTS backend: Supabase Edge Function `language-studio-tts`
- English voice: `marin`
- Japanese voice: `cedar`
- Master audio pace: natural
- Slow / Medium / Natural are playback-rate changes of the same MP3

## Playback flow

1. The browser computes a deterministic SHA-256 audio key.
2. The device checks its local Cache Storage through the service worker.
3. Cache hit: play locally with no network request.
4. Cache miss: fetch the MP3 from Supabase Storage and save it into the device cache.
5. If the central MP3 does not exist, the Edge Function validates the sentence against the published `tts-manifest.json`.
6. The Edge Function calls OpenAI at most once for that sentence, saves the MP3 to Supabase Storage, then future devices reuse it.

## Security

Never put the OpenAI API key in frontend JavaScript, GitHub, screenshots, or chat messages.

Production cloud TTS reads `OPENAI_API_KEY` only from Supabase Edge Function Secrets.

The public Edge Function accepts only sentence hashes present in the generated TTS manifest, so arbitrary public text cannot trigger OpenAI generation.

## Existing audio migration

Legacy MP3 files previously stored under `audio/tts/` were migrated into Supabase Storage.

GitHub Pages no longer needs to ship MP3 files.

## Local Windows mode

Existing local MP3s can still play if they are present, but missing audio now uses the same central Supabase service by default.

The old local `.env.local` TTS path can remain for development, but it is no longer the normal cross-device publishing workflow.

## Fallback

If cloud AI generation is unavailable, Language Studio falls back to the browser SpeechSynthesis voice.
