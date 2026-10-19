# Language Studio v53 — App Mode for iPhone and iPad

**Goal:** Stop making learners scroll through a long website to find the next learning task. Preserve v52's data, AI Coach, daily learning and all previously available exercises.

## Navigation
- Default root: `#vocab` (Cụm chủ động).
- iPhone: top app bar, 4 fixed bottom actions (Cụm, Hôm nay, Mẫu câu, Thêm).
- iPad: narrow, fixed icon rail; the learning surface uses the rest of the viewport.
- Desktop: compact sidebar, fixed header, internal workspace.
- Thêm opens the existing navigation drawer to Japanese, account/settings and legacy screens.

## Main chunk screen
- One contextual CTA driven by existing `VocabularyTrainer.nextPathStep`.
- Four compact actions: Learn, VN→EN Recall, Fast practice, Listening.
- Compact current pattern and progress row.
- Four focused internal tabs: Tổng quan, Học cụm, Luyện tập, Kho cụm.
- Advanced screens such as 'Nhớ cụm', 'Use', and 'Nghe' remain available from links/actions and the original trainer. Nothing has been deleted.
- Other detailed screens scroll **within** the bounded app workspace only when necessary, keeping global navigation fixed.

## iOS
- `height:100dvh` with app-contained scroll, safe-area bottom navigation.
- When the keyboard opens outside the trainer, bottom navigation yields space to the visible viewport.
- Existing Chunk Trainer's special `visualViewport` / keyboard-focus logic is preserved.
- PWA standalone metadata and `#vocab` startup shortcut.

## Compatibility
- Existing v52 `#daily`, `#patterns`, `#japanese`, `#settings`, `#progress`, `#home` routes preserved.
- Old CSS remains intact under new `app-shell-v53.css` layer so reverting the UI is straightforward.
- No schema or Supabase backend changes. All saved vocab/learning progress untouched.
- Static checks: `node scripts/test-app-shell-v53.mjs`.
- Normal build/test/Pages pipeline unchanged apart from additional regression step.

## Notes
- No fixed-height UI should cut off long library content. Long lists and articles can still scroll **inside the bounded workspace**, not the browser document.
- Audio, speech recognition, keyboard and AI roleplay need manual smoke tests on physical iPhone / iPad after deploy.
