# TVS Certified Super Cup 2026–27 — Campaign Schedule

## Pre-launch test window

The application runs an isolated test campaign from 28 September through 14 October 2026. Test scores, ranks, attendance, and activities never carry into the live campaign.

| Test | Date | Time | Safe placeholder |
|---|---|---|---|
| 1 | 1 October 2026 | 2:00 PM IST | `TVSC-2026-10-01` |
| 2 | 8 October 2026 | 2:00 PM IST | `TVSC-2026-10-08` |

Replace each placeholder with its actual TVS auction ID before that test. The sync engine deliberately refuses to contact TVS while a placeholder remains configured. On 15 October, campaign selection automatically changes to `supercup-2026-27`, whose dealer scores start at zero.

## Live campaign period

- Start: 15 October 2026
- End: 31 January 2027
- Status: Active
- Format: 16-match weekly series (Every Thursday at 2:00 PM IST)

## Match schedule

All matches begin at 2:00 PM IST. The references below are safe placeholders; an administrator must replace each one with the actual TVS Certified auction ID before syncing that match.

| Match | Date | Time | Auction reference | Initial status |
|---|---|---|---|---|
| 1 | 15 October 2026 | 2:00 PM IST | `TVSC-2026-10-15` | Upcoming |
| 2 | 22 October 2026 | 2:00 PM IST | `TVSC-2026-10-22` | Upcoming |
| 3 | 29 October 2026 | 2:00 PM IST | `TVSC-2026-10-29` | Upcoming |
| 4 | 5 November 2026 | 2:00 PM IST | `TVSC-2026-11-05` | Upcoming |
| 5 | 12 November 2026 | 2:00 PM IST | `TVSC-2026-11-12` | Upcoming |
| 6 | 19 November 2026 | 2:00 PM IST | `TVSC-2026-11-19` | Upcoming |
| 7 | 26 November 2026 | 2:00 PM IST | `TVSC-2026-11-26` | Upcoming |
| 8 | 3 December 2026 | 2:00 PM IST | `TVSC-2026-12-03` | Upcoming |
| 9 | 10 December 2026 | 2:00 PM IST | `TVSC-2026-12-10` | Upcoming |
| 10 | 17 December 2026 | 2:00 PM IST | `TVSC-2026-12-17` | Upcoming |
| 11 | 24 December 2026 | 2:00 PM IST | `TVSC-2026-12-24` | Upcoming |
| 12 | 31 December 2026 | 2:00 PM IST | `TVSC-2026-12-31` | Upcoming |
| 13 | 7 January 2027 | 2:00 PM IST | `TVSC-2027-01-07` | Upcoming |
| 14 | 14 January 2027 | 2:00 PM IST | `TVSC-2027-01-14` | Upcoming |
| 15 | 21 January 2027 | 2:00 PM IST | `TVSC-2027-01-21` | Upcoming |
| 16 | 28 January 2027 | 2:00 PM IST | `TVSC-2027-01-28` | Upcoming |

## Point system

| Activity | Points |
|---|---:|
| Buy transaction | 10 |
| Sell transaction | 10 |
| Verified match participation | 15 |
| Verified live bid | 2 |
| Vehicle inspection | 1 |
| Watchlist addition | 1 |
| Participate in all 16 matches | 20 bonus |

## Data-integrity rules

1. Only activities timestamped between the campaign start and end can affect scores.
2. Only auctions mapped to one of the 16 campaign matches can be synchronized.
3. Match participation is awarded once per dealer per match.
4. A verified non-pre-bid live bid, buy, or sell can establish participation if the upstream attendance feed omitted it.
5. Previous campaigns remain archived with their ledgers intact and never carry points into this campaign.
6. Dealer scores start at zero and unscored dealers do not appear as ranked competitors.

## Operations

Before each match, an administrator must:

1. Replace the placeholder auction reference with the real TVS auction ID.
2. Set the match status to `LIVE` when the auction opens.
3. Confirm the sync telemetry is receiving the mapped auction.
4. Set the match status to `COMPLETED` after the auction closes.
