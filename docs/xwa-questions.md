# Questions for XWA

Running list of questions for the X-Wing Alliance (points team, design team, organizers). Each
says why it matters so it can be asked without extra context. Move answered questions to the
bottom with the answer and date, and update [architecture.md](architecture.md) if the answer
changes a decision.

## Open

### Card data

1. **Where is the source of truth for XWA card definitions?** When the design team adds a card or
   changes card text, where is it written down first (document, spreadsheet, YASB directly)? Who
   maintains the XWA data inside YASB today?
   _Why:_ we plan to add XWA cards to a fork of the community JSON card dataset
   (xwing-data2). We need to know what to copy from and who to coordinate with.
2. **Where are images for new XWA cards hosted, and may we link to them?**
   _Why:_ the app links to card images rather than storing them, as YASB does.
3. **Does XWA have guidance on showing card text and images in third-party tools?**

### Points

4. **How does the points team manage points today?** Spreadsheet, document, something else?
   Could they share a sample or the column layout?
   _Why:_ the admin tool will accept CSV uploads. Matching their existing format avoids
   re-typing.
5. **How are points versions named and dated?** Version numbers, dates, season names? Is there an
   "effective from" date separate from the announcement date?
6. **Do upgrade costs ever vary by ship?** AMG priced some upgrades by ship size, initiative, or
   agility. Does XWA do this, or is every upgrade a single cost?
7. **How does loadout value work in XWA**, and does it apply to every pilot? Are there pilots
   with fixed ("standard") loadouts whose upgrades cannot be changed?
8. **Who approves publishing a version, and how many people edit points?**
   _Why:_ decides who gets the "points team" role and whether publishing needs a second person.

### Playtesting

9. **Who are the testers and how many are there?** How is someone added or removed?
10. **Are draft points confidential?** If testers must not share them, the tester view needs to be
    login-only and we should avoid shareable links to draft lists.
11. **During a playtest round, do drafts change mid-round,** or is each round a fixed set of points
    until the next round?

### Rules and the restricted list

12. **Is the restricted list tied to a points version** (released and changed together)?
13. **What exactly can be restricted, and what does "restricted" mean?** Pilots, upgrades, or
    both? Banned outright, or limited (e.g. one per list)?
14. **Are other new rules planned** that change list building (not gameplay)? Rule changes need
    code; points changes do not, so early notice helps.

### Formats

15. **Which formats does XWA support or plan to support?** Standard, Extended, Epic, others?
    Does each have its own points or restricted list?

### Collaboration

16. **Would XWA want this tool to be recognized or linked from XWA channels**, and is there someone
    to coordinate with on data contributions back to community projects?

## Answered

_None yet._
