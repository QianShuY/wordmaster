# Desktop layout consistency implementation plan

> **For agentic workers:** Execute inline with superpowers:executing-plans and verify the rendered pages before completion.

**Goal:** Match the hosted training shell to WordMaster and fix the typography and layout defects identified in the user's screenshots.

**Architecture:** Both desktop applications load the same `/shared/desktop-shell.css`. The React app renders the same header structure on its home and exam screens; training-specific tools belong below global navigation. Existing learning data and Android behavior stay intact.

**Tech stack:** Express static assets, vanilla DOM/CSS, React and Vite.

**Spec:** User screenshots and requests in this conversation, 2026-11-03.

## Global constraints

- Reuse the existing feature checkouts and current theme; no replacement artwork or dependencies.
- Do not modify personal learning records or archived vocabulary.
- Change the desktop interface; Android remains paused.
- Numeric glyphs must be upright and aligned while Chinese headings and English prose keep the journal typography.

## Review focus

- The hosted and main headers must align at the same viewport, with and without card wallpaper.
- Training data tools must not displace the global navigation.
- Long exam names and Chinese descriptions must wrap without overflow.
- History remains accessible and read-only, collapsed by default.
- Card collection counts, unlock conditions and daily draw rules remain accurate.

### Task 1: Shared header and numeric typography

- [x] Create `shared/desktop-shell.css`; load it in main HTML and hosted training.
- [x] Reuse one React `WordMasterHeader` for the training home and exam screens.
- [x] Move training-specific tools to the training navigation row.
- [x] Remove the conflicting paper header override and redundant header CSS.
- [x] Build hosted assets; inspect header geometry, classic and themed states, and upright date/title numerals.

### Task 2: Card collection and history layouts

- [x] Reformat desktop card progress into three balanced metrics, with centered rules and action.
- [x] Replace the unstyled history block with a collapsed `历史资料` section and styled rows.
- [x] Inspect desktop today, wordbooks, statistics, cards and training at wide and compact widths.

### Verification

- [x] Run CET TypeScript and existing tests, plus WordMaster tests covering history, card policy and hosted training.
- [x] Complete one independent code review, resolve relevant findings, and save visual evidence.
- [x] Rebuild the actual `/practice/` assets and refresh the preview.

## Execution notes

- This is an authorized correction to an existing design. No new approval round is needed.
- Visual CSS corrections use browser screenshots and computed layout checks instead of tests that duplicate CSS declarations.
- Related WordMaster tests: 21 passed; CET tests: 52 passed; TypeScript and production build passed.
- Classic and illustrated headers measured at 72 CSS px at the default 1280 px viewport, with matching navigation coordinates and backgrounds.
- Independent review identified a legacy two-column card hero at 680 px. Browser reproduction showed a 49 px rule offset; the single-column desktop hero now centers the rule, metrics and button to within 0.01 px, without horizontal overflow.
- Long wordbook titles now occupy one full-width heading row. Parenthesized exam editions stay together; library and toolbar left edges match.
- Direct navigation from the history shelf to statistics changes scrollY from 815 to 0. Training collection changes no longer retain the previous 96 px scroll offset.
- Classic theme checks and exam opening used an isolated temporary database. No personal learning records or owned cards were changed.
