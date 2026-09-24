# Shared AI audio cache

Files in this folder are intentionally tracked by Git.

Cache key:

SHA256(model | profile | voice | language | pace | exact text)

Current profile:
- model: gpt-4o-mini-tts-2025-12-15
- profile: teacher-v1
- English voice: marin
- Japanese voice: cedar

Behavior:
1. Browser checks this static folder first.
2. If a matching MP3 exists, it is reused with zero OpenAI request.
3. On the local Windows server, a cache miss calls OpenAI once and writes the MP3 here.
4. Run PUBLISH-AUDIO-CACHE.bat to push newly generated MP3s to GitHub.
5. Public static hosting uses these MP3s. If a sentence has not been published, it falls back to browser TTS instead of spending OpenAI credits.

Do not put API keys or other secrets in this folder.
