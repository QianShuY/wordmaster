# Cinema download diagnosis — 2026-11-07

## Confirmed faults and fixes

- aria2 permits one active download. A second job reported `waiting`, while the manager/UI reported `downloading`. Added a separate download-waiting state throughout polling, pause/resume, deletion protection and restart recovery. The existing `queued` state still means downloaded media waiting for preparation.
- Fresh engine directories have no DHT routing table, and the initial command supplied no DHT bootstrap. Diagnostic logs explicitly reported `No DHT entry point specified`. Configured an explicit bootstrap, supplementary public trackers and bounded tracker connection/request timeouts. No Windows firewall or global proxy settings were changed.
- Connected peers do not necessarily transfer data immediately. Progress now distinguishes waiting for transfer from receiving the first piece; verified-file progress can remain zero until a complete piece is available.

## Public network checks and limits

Isolated, rate-limited first-episode probes used the existing three curated hashes. These are not full-episode acceptance tests.

| Source | Result after discovery fixes |
| --- | --- |
| Stranger Things S01 | No peer connection or verified bytes in 60 seconds |
| Breaking Bad S01 | No peer connection or verified bytes in 60 seconds |
| Shameless US S01 | Up to 34 connections; logs show incoming 16 KiB piece blocks. A second 60-second probe showed roughly 9–24 KiB/s, but no complete verified piece yet. |

The two unsuccessful probes do not prove globally dead resources. The successful transfer does not establish complete availability, audiovisual correctness, or bilingual subtitle coverage. Catalogue labels explicitly reflect these limits; no source is advertised as fully accepted.

Local evidence (ignored output): `output/cinema-native/verified-1794052941838/report.json`, per-source diagnostic logs and `shameless-us-s01/transfer-proof.json`. Probe processes were stopped and isolated files retained for diagnosis. User jobs and original films were preserved.

## Verification

- Native cinema tests: 9 passed, including a real fresh aria2 configuration check.
- Training frontend suite: 89 passed; TypeScript check and integrated production build passed.
- Queue regression covers waiting → active, duplicate resume prevention, pause/restart, and first-piece messaging.
