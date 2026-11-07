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
