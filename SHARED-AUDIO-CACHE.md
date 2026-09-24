# Central + device audio cache

Language Studio uses two cache layers.

## 1. Central cache

Supabase Storage bucket:

```text
language-studio-audio/
└── tts/
    └── <sha256>.mp3
```

The key is:

```text
SHA256(model identity | profile | voice | language | natural | exact text)
```

Current identity:
- model identity: `gpt-4o-mini-tts-2025-12-15`
- API model used by the cloud generator: `gpt-4o-mini-tts`
- profile: `teacher-v1`
- English voice: `marin`
- Japanese voice: `cedar`

One natural master MP3 is reused for Slow / Medium / Natural playback speeds.

## 2. Device cache

Online devices use Service Worker + Cache Storage:

```text
language-studio-audio-v1
```

First listen:
- device cache miss
- download from Supabase
- store locally
- play

Later listens:
- play from local device cache
- no MP3 download

The browser/OS may eventually reclaim site storage. If that happens, the device downloads the MP3 from Supabase again, but OpenAI does not regenerate it.

## Missing central audio

The browser asks the Supabase Edge Function `language-studio-tts`.

The function:
1. validates the requested hash against `tts-manifest.json`
2. reuses existing Storage audio if present
3. otherwise generates one OpenAI TTS MP3
4. uploads it to Supabase Storage
5. returns the ready audio

This keeps OpenAI usage bounded to published lesson sentences.

## GitHub

GitHub stores code and lesson content only.

MP3 files are no longer the normal GitHub publishing mechanism.
