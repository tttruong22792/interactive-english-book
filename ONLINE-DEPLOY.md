# Online phone deployment

## Recommended architecture

Private GitHub repository
  -> static build (npm run build)
  -> HTTPS static hosting
  -> shared audio/tts MP3 files

The OpenAI API key stays only on a trusted backend/local PC.

## Cost-safe behavior

On an online static site:
- published AI MP3 exists -> play it
- AI MP3 missing -> browser voice fallback
- no automatic OpenAI API call

This means opening the site on iPhone/Android cannot unexpectedly spend API credit.

## Build

Run:

npm run build

Output:

dist/

The build creates runtime.js automatically from the current content index and copies:
- index.html
- styles.css
- manifest.webmanifest
- sw.js
- icons/
- audio/

## Hosting choices

### GitHub Pages

The repository already contains .github/workflows/pages.yml.
It builds dist/ and deploys only the static site artifact.

GitHub Pages availability for a private repository depends on the GitHub plan.

### Vercel / Cloudflare Pages

Keep the repository private and connect it to the hosting provider.

Build command:

npm run build

Output directory:

dist

After connection, each push to main can redeploy the site automatically.

## Normal workflow

1. Learn on the Windows app.
2. New AI speech is generated only when a sentence has no shared MP3 yet.
3. The server saves that MP3 into audio/tts.
4. Double-click PUBLISH-AUDIO-CACHE.bat when you want those files available online.
5. GitHub push triggers the connected static host to redeploy.
6. Phone then reuses the exact same MP3 with zero new OpenAI request.

## Important

Do not commit .env.local.
Do not expose OPENAI_API_KEY in frontend code.
Do not bulk-generate all speeds and all sentences unless you actually need them.
