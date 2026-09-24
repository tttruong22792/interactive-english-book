# Legacy audio directory

Language Studio audio is now stored centrally in Supabase Storage:

```text
bucket: language-studio-audio
path:   tts/<hash>.mp3
```

The old GitHub-tracked MP3 files were migrated to Supabase and removed from the repository.

This directory remains only as a compatibility placeholder for older local scripts.

Do not commit API keys or new MP3 files here.
