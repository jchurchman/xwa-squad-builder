# Architecture decisions

Living record of how the XWA Squad Builder is put together. Each decision has a status:

- **Accepted:** agreed; build on it.
- **Proposed:** a recommendation awaiting sign-off; build on it only if the task requires it, and
  flag that you did.
- **Open:** undecided; do not build on it.

Questions that only XWA can answer are tracked in [xwa-questions.md](xwa-questions.md).

## Goals

1. Card data and points live outside UI code, so updating points or adding cards never requires
   a code change.
2. Three audiences:
   - **Public:** build lists against the current or a recent published points version.
   - **Testers:** build lists against the current playtest points.
   - **Points team:** edit points and move versions through their lifecycle.
3. Users can share lists by link without an account, and save lists to an account with Discord
   login.
4. Contribute improvements back to community projects (xwing-data2, XWS) where they apply.

## Decisions

### D1. Go backend replaces the Node server — Accepted

A new Go server lives in `backend/` (named so the legacy `server/` needn't be renamed during the
transition). The Node server in `server/` is frozen and will be removed once nothing depends on
it. The React client in `client/` is kept.

### D2. Card definitions come from a fork of xwing-data2 — Accepted

[xwing-data2](https://github.com/xwingtmg/xwing-data2) is MIT-licensed JSON for every ship, pilot,
and upgrade, split by faction and card type, with card text and image URLs. Its last commit was in
January 2025 and it has no XWA content. So we fork it and:

- add XWA cards and XWA card changes to the fork;
- extend its restriction format for XWA-only rules (e.g. the restricted list, if it is
  card-level);
- ignore the `cost` and `loadout` fields embedded in card files for XWA points (see D4);
- propose changes upstream where they are useful beyond this project.

Card text is shown from the data; images are linked by URL, as YASB does, not stored.

How the backend gets the card data:

- A file in this repo (e.g. `data/cards.version`) pins the fork commit to use.
- The backend's import command downloads that exact commit from GitHub and loads it into SQLite.
- For local card editing, an environment variable points the import at a local checkout of the
  fork instead of downloading.
- Updating cards means changing the pinned commit and re-running the import.

A git submodule was considered and rejected: it pins just as well, but every clone, pull, and
card change needs extra submodule steps that are easy to forget.

### D3. Cards are identified by type + XWS ID — Accepted

XWS IDs are unique per card type, not globally. Each card type gets its own table (`ships`,
`pilots`, `upgrades`) with the XWS ID as that table's key, so uniqueness is per table and
collisions between types never matter. Anything that refers to a card from outside its table
(a points CSV row, a restricted list entry) must also say which type it is.

Database auto-increment IDs are never exposed outside the backend. Saved lists, URLs, and CSVs
use XWS IDs, so they survive a re-import.

### D4. Points are versioned in the database — Accepted

```text
points_versions
  id, source (xwa | amg), label, status (draft | testing | published),
  based_on_version_id, created_at, status_changed_at

pilot_costs    (version_id, pilot_xws,   cost, loadout)
upgrade_costs  (version_id, upgrade_xws, cost)
```

- Every version holds a full copy of all costs (about 1,300 rows), not a diff. Copies are cheap
  at this size and make reading any version trivial.
- **Lifecycle:** draft → testing → draft → testing → … → published.
  - Each source has at most one draft at a time. Only drafts are editable.
  - Sending a draft to testers locks it as a `testing` version. A new draft is created
    immediately as a copy of that testing version, and the team edits that while waiting for
    feedback.
  - Every tester round is kept, so there is a history of exactly what testers saw.
  - Publishing promotes the newest `testing` version to `published`, since that is what testers
    validated. The next draft is a copy of it.
- Testers see one version at a time: the newest `testing` version.
- The public sees the current published version plus the two before it.
- AMG's official points are imported as `source = amg` versions from xwing-data2's cost fields.
  They are read-only.

Open within D4:

- Whether the restricted list belongs to a points version (see XWA questions). If it does, it
  becomes a `restricted_cards (version_id, card_type, xws)` table.
- AMG upgrade costs vary by ship size, initiative, or agility. Whether XWA does the same decides
  if `upgrade_costs` needs more than one `cost` column (see XWA questions).

### D5. CSV upload changes only what differs — Accepted

The points team uploads a CSV to update the current draft. Expected columns (pending a sample of
the team's real spreadsheet): `card_type, xws, cost, loadout`.

- Rows whose values match the draft are ignored, so uploading a whole file with a few changes
  only changes those few.
- Unknown `card_type`/`xws` pairs or invalid values reject the whole upload, with a list of the
  bad rows. Nothing is partially applied.
- The uploader sees a preview of changed rows (old → new) and confirms before it is applied.
- Uploads only ever touch a draft. Testing and published versions are not edited.

### D6. Roles and Discord login — Accepted

Login uses Discord OAuth. Roles:

| Role        | Can                                                   |
| ----------- | ----------------------------------------------------- |
| anonymous   | build and share lists against published versions      |
| user        | the above, plus save lists to their account           |
| tester      | the above, plus use the version in testing            |
| points team | the above, plus upload CSVs and change version status |

Roles are granted manually by an admin. How the first admin is set (config or a CLI command) is
an implementation detail.

### D7. Lists — Accepted

- **Shared without login:** the whole list is encoded in the URL, as YASB does. No server storage,
  no spam risk, no cleanup.
- **Saved to an account:** stored in the database as XWS JSON plus the points version ID it was
  built against. When a newer version is published, the app can show how the list changed
  (e.g. "now 4 points over").
- XWS has no field for a points version. If one is needed in exported lists, that is a candidate
  contribution to xws-spec.

### D8. Rules are declarative data, evaluated in both client and backend — Accepted

YASB expresses some rules as arbitrary functions. We will not. Every restriction is a typed
entry in the card JSON (e.g. "requires faction", "max per squad", "requires slot equipped").

- The client evaluates rules for instant feedback while building.
- The backend evaluates them again when a list is saved to an account.
- Two implementations (TypeScript and Go) can drift apart. To prevent that, rule test cases live
  as shared JSON fixtures that both test suites run.
- A new XWA rule type means adding it to the fork's format and to both evaluators. This is
  acceptable because rule changes are rare.

### D9. Connect RPC is the API contract — Accepted

Protobuf files define every request and response. Code generated from them replaces `shared/`:

- Go: `connect-go` handlers and message types.
- TypeScript: `protoc-gen-es` generates message types and service definitions. The client calls
  the backend through `@connectrpc/connect-web`.

**Proposed** details:

- `.proto` files live in a top-level `proto/` directory.
- The Buf CLI runs code generation for both languages from one config.
- The client keeps RTK Query for caching. Its endpoints call the generated Connect client from a
  `queryFn` instead of using `fetchBaseQuery`.

### D10. Local-only development; hosting deferred — Accepted

Everything runs locally with SQLite until there is something to share. Choices that keep cheap
hosting possible later:

- one Go binary that also serves the built client;
- SQLite through a pure-Go driver (e.g. `modernc.org/sqlite`), so builds need no C toolchain;
- configuration through environment variables only.

## Not yet addressed

- Card changes over time: if XWA changes a card's text or removes a card, do older points
  versions need the older card definition?
- Translations (the client routes include a language segment, `/:lang/:faction`).
- Formats beyond standard play (epic, quick builds).
