# Curated metadata (2026-11-07)

These small .torrent files contain resource metadata, not movie bytes. Download is never started when opening the library. Full download availability and subtitle contents are not guaranteed by metadata verification.

| Hash | Source page | Checked video count |
|---|---|---|
| fb875cba4374f235a2d28ecbe00e4070f66d4b32 | https://www.seedhub.cc/movies/1754/ (user supplied Thunder URI) | Stranger Things S01, 8 episodes |
| bc0e4f6e3a12d2e1eebc67fed2385b2acf48e95f | https://www.cilixiong.org/drama/2089.html | Shameless US S01, 12 episodes |
| 161f493bf2ee8c71beeb57a1b73d66224bc920b8 | https://www.cilixiong.org/drama/1625.html | Breaking Bad S01, 7 episodes |

Metadata was retrieved from the public iTorrents cache's documented `/torrent/UPPERCASE_HASH.torrent` endpoint and validated by SHA-1 of the exact bencoded info bytes against each source magnet. This is not an endorsement of arbitrary cache contents; mismatched hashes, non-video resources and unsafe paths are rejected. No dynamic scraping, gate bypass or executable download from film websites is performed by the application.

Source cache URLs are not required at runtime for these entries. Public peers and trackers still determine whether actual file bytes can be downloaded. The first supplied link's peer test did not transfer bytes during this session; the UI therefore says only that its episode list has been checked.

## Replacement sources, 2026-11-07 evening

The catalogue now uses the following two alternatives. Previous metadata remains for existing jobs and rollback; user downloads are not migrated or deleted.

| Hash | Provenance | Validation |
| --- | --- | --- |
| 38fae5f9185583d407bd7044d0a98f63813f8224 | https://www.torrentfunk.com/torrent/19930550/stranger-things-season-1-s01-1080p-x265-hevc-10bit-aac-5-1-silence.html | Stranger Things S01, Silence 1080p, 8 episodes; first episode: 16 MiB verified in a 44-second local probe, peak 1.62 MiB/s |
| 7008d4a01c56d6cac20bb98bef9a3144a22fb56e | https://www.torlock.com/torrent/14928797/breaking-bad-season-01-s01-complete-720p-10bit-2ch-x265-hevc.html | Breaking Bad S01, PSA 720p, 7 episodes; first episode: 14,288,340 verified bytes in 92 seconds, peak 852 KiB/s, lower speeds later |

Torrent metadata came respectively from the page-linked `https://ft.t0r.store/tor/19930550.torrent` and the iTorrents cache for the published hash. Paths and info hashes were checked with the application parser before installation.

These are bounded transfer probes, **not full-episode playback/audio/subtitle acceptance or speed guarantees**. English audio tags and subtitle availability will be checked by the existing preparation pipeline after a complete download. Full-season size is about 11.9 GiB for Stranger Things and 1.72 GiB for Breaking Bad. First episodes are about 1.52 GiB and 373.6 MiB respectively.

Rejected in this comparison: Stranger Things GalaxyTV 720p (`fc43a8dbe2c723ffd857d13f4cd513a93f251c2e`) did not finish a verified piece in 93 seconds; Shameless DeeJayAhmed 720p (`5786602bdd84e7ed79b0939546ef231d14b25932`) transferred no data in 93 seconds. Shameless retains the prior RARBG source because the tested alternative was not better.

Ignored local measurement reports: `output/cinema-native/alternatives-1794054161905/report.json` and `output/cinema-native/alternatives-1794054372040/report.json`.

Subsequent first-episode header inspection of the new Stranger Things source confirmed HEVC video, tagged English AAC audio, and an English PGS image-subtitle track only. It has **no embedded Chinese or machine-readable text subtitle track** in that inspected episode. The catalogue explicitly requires a separate bilingual SRT for sentence learning; the existing application will report `needs-subtitles` rather than pretending these subtitles are ready. Evidence: `output/cinema-native/alternatives-1794054372040/38fae5f9185583d407bd7044d0a98f63813f8224/tracks.json`.

## Additional series, 2026-11-07

Existing three catalogue entries were retained unchanged. Added Young Sheldon season one:

- Hash `4f3906d4a010b9000f1e719cf1a1d57d913c8180`; source https://www.cilixiong.org/drama/3506.html.
- `Young.Sheldon.S01.1080p.BluRay.x265-RARBG`, 22 episodes. First episode: 357,237,079 bytes (about 341 MiB).
- Isolated first-episode probe: 16 MiB verified in 20 seconds, peak 2,222,854 bytes/s, up to 45 connections. Probe was capped at approximately 2 MiB/s and stopped; this is not a full-download acceptance or a speed guarantee.
- First-episode stream header: HEVC video and tagged English AAC audio. No embedded subtitles. Torrent metadata includes separate English SRT files but no confirmed Chinese subtitles; current one-video download pipeline does not automatically ingest those sidecars. Catalogue explicitly says bilingual subtitles must be added separately.
- Evidence: `output/cinema-native/alternatives-1794055654056/report.json` and the per-hash `tracks.json`.

Rejected candidates in the same pass (short local probes, not claims that a torrent is globally dead):

| Candidate | Hash | Outcome |
| --- | --- | --- |
| Friends S01 720p sujaidr | 1df3b55a3c4ff2cc1de22012ca18c548afcecf8e | 93 seconds, no transfer |
| Friends S01 1080p TENEIGHTY | 8976e87d0ad5e0fe9daa31929b6dc99bfbeaf9c8 | 92 seconds, no transfer |
| Friends S01 alternate metadata | f46d913b5531ed55ad0b905fd75839b964961906 | 93 seconds, no transfer |
| Modern Family S01 x265 RARBG | 1780c52f41bd08c4f3cee797be274676f25b51bb | 93 seconds, roughly 24 KiB/s after a brief 157 KiB/s peak; no verified piece |
| The Big Bang Theory S01 CiNEFiLE | 355708456d2823e55368fc02fa46b7b6814150a0 | 92 seconds, no transfer |
| Reacher S01 x265 RARBG | f3e764cf53104f4bdfcc6a6388d6b0c698c57fa0 | 93 seconds, no transfer |

All probes used isolated output directories, left the user's download queue untouched and stopped their engines on completion. Only the successful candidate was added to the application cache.
