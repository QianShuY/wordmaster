# Desktop BT cinema

User approved in-app BitTorrent download followed by automatic English audio/subtitle preparation. Source is a user-supplied magnet (Thunder wrapper also supported). No automatic website scraping or login/captcha bypass.

Implementation: private child aria2 RPC on loopback with random port/token, lazy start, no user RPC options; metadata-only resolution followed by explicit one-video selection. Validate bencoded torrent paths and v1 info hash before adding it. Download to per-job directories under a private cinema data directory. Persist state; restart leaves interrupted jobs paused. Finished downloads stop seeding. UI polls progress, offers pause/resume, and does not call missing peers ready.

Preparation: FFprobe selects tagged English audio and English/Simplified text subtitles. FFmpeg remuxes a private MP4 with English audio; unsupported video codecs may require conversion. Subtitle timing merge retains missing translations honestly. No English audio -> actionable error. No English/Chinese subtitles -> subtitles-needed state; permit manual bilingual SRT to complete. Originals retained. Ready media served by owned ID with HTTP Range, cues via same-origin JSON; no full video in browser memory.

Tasks:
- [x] Install verified official aria2 binary locally; isolate native components and describe release dependency inclusion.
- [x] Magnet/Thunder normalization and torrent validation tests.
- [x] Private engine, persisted manager, media preparation, guarded routes, lifecycle tests.
- [x] Desktop UI: source card, episode selection, download state, automatic player handoff, subtitle recovery.
- [x] Local torrent fixture end-to-end test and actual supplied metadata probe; test pause/restart/range. No claim that peers/download speeds are guaranteed.
- [x] Existing suites/typecheck/build, review, preview, commit/push feature branches.

Constraints: no personal DB tests; no arbitrary remote URL proxy; no user file paths or aria2 RPC token exposed; reject traversal/ADS/absolute torrent paths; downloading is explicit, never happens merely by opening the library. Do not delete source/user files. Native engine port must remain private. Keep original HTTP/OPFS package downloads working.

Verification: 463 WordMaster tests + 89 training tests passed; typecheck and production build passed. Independent review findings (input/output collision, pause/resume polling race, repeated native playback readiness) fixed and re-reviewed. Real aria2 local webseed download -> English AAC/MP4 -> bilingual SRT extraction -> browser playback passed, including repeated open. Three curated metadata info hashes and 8/12/7 video entries verified. Public peer probe for supplied first-season magnet transferred zero bytes in its bounded window; do not claim public download availability. Live service restarted on 3456; per-episode selector verified without downloading a season.
