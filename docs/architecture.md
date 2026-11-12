# Architecture decisions

Living record of how the XWA Squad Builder is put together. Each decision has a status:

- **Accepted:** agreed; build on it.
- **Proposed:** a recommendation awaiting sign-off; build on it only if the task requires it, and
  flag that you did.
- **Open:** undecided; do not build on it.

Questions that only XWA can answer are tracked in [xwa-questions.md](xwa-questions.md). Some
decisions rest on working assumptions recorded there; they are marked "(working assumption)".

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
January 2025 and it has no XWA content. So we fork it
([jchurchman/xwing-data2](https://github.com/jchurchman/xwing-data2)) and:

- add XWA cards and XWA card changes to the fork;
- extend its restriction format for XWA-only card restrictions;
- ignore the pilot `cost`, `loadout`, and `slots` fields and the upgrade `cost` field embedded in
  card files, since XWA changes those in its points versions (see D4). **Temporary:** until
  points versions exist, the import reads pilot `slots` from the card files as a stand-in;
- propose changes upstream where they are useful beyond this project.

How the backend gets the card data:

- `backend/cards.version` pins the fork commit to use, as `owner/repo@commit`.
- The import command (`backend/cmd/importcards`) downloads that exact commit from GitHub and
  loads it into SQLite.
- For local card editing, `CARD_DATA_PATH` points the import at a local checkout of the fork
  instead of downloading.
- Updating cards means changing the pinned commit and re-running the import.

A git submodule was considered and rejected: it pins just as well, but every clone, pull, and
card change needs extra submodule steps that are easy to forget.

**Card text, images, and attribution** (working assumption, Q2 and Q3):

- Card text is shown from the data. Images are linked by URL, as YASB does, not stored.
- Every page carries an attribution footer, matching the one on xwing.life:

  > A volunteer, not-for-profit fan community. Not affiliated with Lucasfilm, Disney, Atomic
  > Mass Games, Asmodee, or FFG. Star Wars © Lucasfilm Ltd. X-Wing© Atomic Mass Games. All
  > trademarks belong to their respective owners.

### D3. Cards are identified by type + XWS ID — Accepted

XWS IDs are unique per card type, not globally. Each card type gets its own table (`ships`,
`pilots`, `upgrades`) with the XWS ID as that table's key, so uniqueness is per table and
collisions between types never matter. Anything that refers to a specific card from outside its
table (such as a points CSV row) must also say which type it is.

The restricted list is the exception: it works by card name, not card ID (see D4).

Database auto-increment IDs are never exposed outside the backend. Saved lists, URLs, and CSVs
use XWS IDs, so they survive a re-import.

### D4. Points are versioned in the database — Accepted

A points version holds everything XWA changes in a points release: squad points, loadout values,
pilot upgrade slots, upgrade costs, and the restricted list.

```text
points_versions
  id, source (xwa | amg), label, effective_date,
  status (draft | testing | published), based_on_version_id, created_at, status_changed_at

pilot_costs        (version_id, pilot_xws, cost, loadout, slots)
upgrade_costs      (version_id, upgrade_xws, faction, cost)
restricted_entries (version_id, faction, kind, ship_or_type, name, max_copies)
```

- **Labels** follow XWA's naming, e.g. `50P 2.1.1`. The effective date comes from the points
  release document.
- **Pilot slots** are the list of upgrade slots a pilot has, duplicates included (e.g. two
  Torpedo slots). They live in the points version because XWA can change them during the points
  and playtesting cycle.
- **Upgrade costs** are one cost per upgrade. A row with an empty `faction` applies to every
  faction; a row with a faction overrides it for that faction, for cross-faction upgrades priced
  differently per faction. XWA does not currently vary costs by ship size, initiative, or agility.
- **Restricted entries** mirror the columns of XWA's restricted list (see D5). `faction` is one of
  the seven factions or `Generic`; `kind` is `Pilot` or `Upgrade`; `ship_or_type` is the pilot's
  ship or the upgrade's type. The rule itself counts same-named ships and upgrades together (see
  D8).
- Every version holds a full copy of all of the above (roughly 1,300 rows plus the restricted
  list), not a diff. Copies are
  cheap at this size and make reading any version trivial.
- **Formats:** XWA does not distinguish Standard from Extended, and Epic uses the same points and
  restricted list. So versions have no format dimension.

**Lifecycle:** draft → testing → draft → testing → … → published.

- Each source has one draft at a time, shared by the whole points team. Only drafts are editable.
- Sending a draft to testers locks it as a `testing` version. A new draft is created immediately
  as a copy of that testing version, and the team edits that while waiting for feedback.
- Each tester round is fixed: a testing version never changes. Every round is kept, so there is a
  history of exactly what testers saw.
- Publishing promotes the newest `testing` version to `published`, since that is what testers
  validated. The next draft is a copy of it.
- Testers see one version at a time: the newest `testing` version.
- The public sees the current published version plus the two before it.
- AMG's official points are imported as `source = amg` versions from xwing-data2's cost fields.
  They are read-only.

### D5. Points admin UI and CSV round-trip — Accepted

We define the points format (working assumption, Q4). The points team edits the shared draft in
two ways:

- **In the admin UI**, directly.
- **By CSV:** download the draft as a CSV in our format, edit it in a spreadsheet, and upload it
  back.

There are two CSV files, each downloaded from and uploaded to the draft.

**Points CSV**

- Columns: `card_type, xws, name, faction, cost, loadout, slots`.
  - `name` is for readability and is ignored on upload.
  - `faction` is only used for per-faction upgrade costs; otherwise empty.
  - `loadout` and `slots` are only used for pilots.
  - `slots` is a semicolon-separated list, repeats allowed, e.g.
    `Talent;Torpedo;Torpedo;Modification`. Uploads accept slots in any order and sort them into
    a fixed slot order, borrowed from YASB (the current client already has this order as
    `SLOT_ORDER` in `client/src/constants.ts`). Downloads always use the sorted order.
- Rows whose values match the draft are ignored, so uploading a whole file with a few changes
  only changes those few. Rows missing from the file are left unchanged.

**Restricted list CSV**

- Columns match XWA's existing restricted list: `Faction, Kind, Ship/Type, Name, Restricted`.
  - `Faction`: one of the seven factions, or `Generic`.
  - `Kind`: `Pilot` or `Upgrade`.
  - `Ship/Type`: the pilot's ship, or the upgrade's type.
  - `Name`: the pilot or upgrade name. Must match a card of that kind and ship/type, which
    catches typos.
  - `Restricted`: the maximum number of copies allowed in a list.
- An upload replaces the whole restricted list, unlike the points CSV. The list is
  short and sparse, so "rows missing from the file are left unchanged" would leave no way to
  remove an entry by CSV. The preview shows added, removed, and changed entries.

**Rules for both**

- An upload whose columns do not exactly match the format is rejected.
- Invalid rows reject the whole upload, with a list of the bad rows. Nothing is partially
  applied.
- The uploader sees a preview of the changes (old → new) and confirms before they are applied.
- Uploads only ever touch the draft. Testing and published versions are not edited.

### D6. Roles and Discord login — Accepted

Login uses Discord OAuth. Roles are cumulative; each includes everything above it:

| Role        | Adds                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| anonymous   | build, share, and export lists against published versions                    |
| user        | save lists to their account                                                  |
| tester      | build and export lists against the version in testing                        |
| points team | edit the draft (UI or CSV), send it to testers, grant and revoke tester role |
| points lead | publish a version                                                            |
| admin       | grant and revoke any role                                                    |

- Points team members manage tester roles (working assumption, Q9).
- Any points team member can send a draft to testers. Only points team leads publish (Q8).
- How the first admin is set (config or a CLI command) is an implementation detail.

### D7. Lists — Accepted

- **Shared without login:** the whole list is encoded in the URL, as YASB does. No server storage,
  no spam risk, no cleanup.
- **Saved to an account:** stored in the database as XWS JSON plus the points version ID it was
  built against. When a newer version is published, the app can show how the list changed
  (e.g. "now 4 points over").
- **XWS export** is available to everyone, including testers building against the testing
  version, so lists can be loaded into Tabletop Simulator's X-Wing mod.
- **Draft points confidentiality:** testing points are only served to logged-in testers. This is
  a login wall, not leak prevention (testers can export lists, and XWA accepts that). A shared
  link opened by someone who is not a tester shows the list priced with published points.
- XWS has no field for a points version. If one is needed in exported lists, that is a candidate
  contribution to xws-spec.

### D8. Rules are declarative data, evaluated in both client and backend — Accepted

YASB expresses some rules as arbitrary functions. We will not. Every restriction is a typed
entry in the data:

- **Card restrictions** live in the card JSON (e.g. "requires faction", "max per squad",
  "requires slot equipped").
  - An upgrade's `restrictions` is a list of groups. Every group must be met; a group is met when
    **any one** of its conditions is. This matches the cards: 0-0-0's single group
    `{factions: [Scum], names: [Darth Vader]}` reads "Scum, or a squad including Darth Vader".
  - The import rejects any restriction key it does not recognize, so a new kind of restriction
    in the fork fails loudly instead of being ignored.
  - Enforced in the client today: factions, ships, sizes, actions (difficulty too, when given),
    keywords, ship abilities, names in the squad, equipped slot types, arcs, Force side,
    solitary, the `limited` copy count by name across pilots and upgrades, and room for
    upgrades that occupy more than one slot. Code: `client/src/rules/upgradeRules.ts`.
  - Not enforced yet: `standardized` and `non-limited`. Both are about the whole list rather than
    one ship, and belong with list validation.
- **Points-version rules** use data from the points version:
  - **Slots:** every upgrade needs a free slot of its type on the pilot. A pilot with one
    Modification slot can equip only one Modification, however cheap.
  - **Loadout:** the total point cost of a ship's upgrades cannot exceed its loadout value. Slots
    and loadout apply together: a pilot with one Talent slot, one Modification slot, and 17
    loadout who equips a 12-point Talent can only add a Modification costing 5 or less.
  - **Restricted list:** for each entry, the number of pilots and upgrades in the squad with that
    name cannot exceed `max_copies`.
    - An entry applies only to lists of its faction; a `Generic` entry applies to every faction.
    - Counting is by name only, across pilots and upgrades, like the `unique` rule: a `Pilot`
      entry for "Han Solo" also counts a "Han Solo" crew upgrade. Unlike `unique`, the limit
      can be more than 1. `Kind` and `Ship/Type` identify the card for validation and display;
      they do not narrow what is counted.
    - Standard loadout pilots count if their loadout includes the named ability or upgrade.

Evaluation:

- The client evaluates rules for instant feedback while building.
- The backend evaluates them again when a list is saved to an account.
- Two implementations (TypeScript and Go) can drift apart. To prevent that, rule test cases live
  as shared JSON fixtures that both test suites run.
- A new XWA rule type means adding it to the data format and to both evaluators. This is
  acceptable because rule changes are rare.
- Today only the client evaluates rules, since lists cannot be saved yet. The Go evaluator and
  the shared fixtures come with saving lists. The client's cases are in
  `client/src/rules/__tests__/upgradeRules.test.ts` and are the starting point for those fixtures.
- Until points versions exist, the client shows no points and does not check loadout. Standard
  loadout pilots show their fixed upgrades from the card data's `standardLoadout`.

Open within D8:

- **Solitary.** The client allows a solitary upgrade only if no other ship in the squad has an
  upgrade of the same type. This follows the previous YASB-based code; confirm against the
  current rules text.

### D9. Connect RPC is the API contract — Accepted

Protobuf files define every request and response. Code generated from them replaces `shared/`:

- Go: `connect-go` handlers and message types.
- TypeScript: `protoc-gen-es` generates message types and service definitions. The client calls
  the backend through `@connectrpc/connect-web`.

Setup:

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
