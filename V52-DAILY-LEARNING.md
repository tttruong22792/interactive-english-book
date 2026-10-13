# Language Studio v52 — Hôm nay 25 phút

Released design implementation based on the restored v51 baseline (2026-10-08).

## Entry points
- Desktop sidebar: Hôm nay · 25 phút.
- Mobile bottom bar: Hôm nay.
- Home page: Học hôm nay · 25 phút.
- Direct route: #daily.

## One session, five steps
1. Review old chunks (~5 minutes): existing Chunk SRS, 0–6 due/weak chunks, VN-to-EN recall and optional speech recognition.
2. Learn (~7 minutes): 0–3 new Chunk Family items and diverse real-life usage examples. No automatic "mastered" credit for reading.
3. Recall (~5 minutes): make complete sentences from Vietnamese ideas; calls existing recordMemory for SRS, but does not award automatic conversational Use skills.
4. AI conversation (~6 minutes): turns with an authenticated conversational partner, a short scenario and at most five learner turns. Roleplay with text input or browser speech recognition. An explicitly labeled non-AI fallback remains available when offline, logged out, out of quota or AI is unavailable.
5. Summary (~2 minutes): review results, used chunks and difficult chunks for future study.

Minutes are targets, never timers forcing a skip. The study session resumes after leaving or refreshing the page.

## Data and privacy
- Reuses previous chunk progress keys; no deletion of v51 learning screens or data.
- Local session data lives in state.dailyV52Sessions keyed by account and local date; incomplete drafts live on device.
- Authenticated sync to public.language_studio_daily_sessions on the existing Language Studio auth project. Policies restrict users to their own user_id.
- Cloud snapshots intentionally exclude conversation transcripts and unfinished drafts by default.
- Confirmation of words used during AI dialogue is advisory. Never auto-credit entire grammatical ability or pronunciation.
- Dialogue AI is provided by language-studio-daily-conversation in the existing Japanmate Supabase project. User bearer tokens are independently validated against the Language Studio Auth project. The AI token stays server-side.
- Quota shared with existing AI Coach using language_studio_reserve_ai_coach. 503/429 errors offer non-AI roleplay.

## Deployment
- Static bundle: runtime-20261013-daily-v52.js.
- Service worker cache: language-studio-v88-daily-v52.
- Build: npm run build.
- Test: node scripts/test-daily-v52.mjs.

## Not yet included (next releases)
- Real-time speech-to-speech audio streaming or advanced pronunciation scoring.
- Automatic linguistic adjudication of unlimited open-form answers without AI.
- Cross-device synchronization of *full* conversations (excluded by privacy design).
- Fully adaptive minute-by-minute schedule optimization or teacher-managed class analytics.

This release integrates the current learner's existing SRS + Chunk Trainer rather than replacing them.
