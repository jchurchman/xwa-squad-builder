# Questions for XWA

Running list of questions for the X-Wing Alliance (points team, design team, organizers).

How to use this file:

- Questions keep their number for good, so references like "Q5" stay valid.
- Each open question says why it matters, so it can be asked without extra context.
- When a question is answered, move it to [Answered](#answered) with the answer and date.
- A question with only part of its answer stays under [Open](#open) with the answer so far.
- A _working assumption_ is how we proceed until XWA answers. The question stays open.
- If an answer changes a decision, update [architecture.md](architecture.md).

## Open

### Card data

**Q1. Where is the source of truth for XWA card definitions?** When the design team adds a card
or changes card text, where is it written down first (document, spreadsheet, YASB directly)? Who
maintains the XWA data inside YASB today?

- _Why:_ we plan to add XWA cards to a fork of the community JSON card dataset (xwing-data2). We
  need to know what to copy from and who to coordinate with.

**Q2. Where are images for new XWA cards hosted, and may we link to them?**

- _Why:_ the app links to card images rather than storing them, as YASB does.
- _Working assumption (2026-10-28):_ link to them as YASB does.

**Q3. Does XWA have guidance on showing card text and images in third-party tools?**

- _Working assumption (2026-10-28):_ attribute wherever possible, using the same wording as the
  xwing.life footer:

  > A volunteer, not-for-profit fan community. Not affiliated with Lucasfilm, Disney, Atomic
  > Mass Games, Asmodee, or FFG. Star Wars © Lucasfilm Ltd. X-Wing© Atomic Mass Games. All
  > trademarks belong to their respective owners.

### Points

**Q4. How does the points team manage points today?** Spreadsheet, document, something else?
Could they share a sample or the column layout?

- _Why:_ the admin tool will accept CSV uploads. Matching their existing format avoids
  re-typing.
- _Working assumption (2026-10-28):_ we define the format. The points team edits a shared draft
  in an admin UI, can download it as a CSV in our format, and uploads the same format back.
  Files in any other format are rejected.

### Playtesting

**Q9. Who are the testers and how many are there?** How is someone added or removed?

- _Answer so far (2026-10-28):_ testers log in to this app, and a tester role is applied to
  their user account.
- _Working assumption (2026-10-28):_ points team members grant and remove the tester role.
- _Still open:_ roughly how many testers there are.

### Collaboration

**Q16. Would XWA want this tool to be recognized or linked from XWA channels?** Is there someone
to coordinate with on data contributions back to community projects?

## Answered

All answers below were recorded on 2026-10-28.

### Points

**Q5. How are points versions named and dated?**

- Points releases are versioned documents named like `50P 2.0`, `50P 2.1`. "50P" refers to the
  50-point version of the game XWA introduced. The latest version is 2.1.1.
- Each points release document includes an effective date.

**Q6. Do upgrade costs ever vary by ship?**

- Not currently by ship size, initiative, or agility, though that may happen in the future.
- Some cross-faction upgrades can have a different cost per faction.

**Q7. How does loadout value work in XWA, and does it apply to every pilot?**

- Every ship has a loadout value, and it changes as part of the points and playtesting cycle
  along with squad points. From the
  [XWA 50P listbuilding appendix](https://www.xwing.life/rules/50p-listbuilding-appendix.pdf):

  > Each ship has a loadout value that determines how many upgrade cards it can equip. This
  > value is used during squad building to build lists that are legal for different game modes.
  > A ship cannot equip more upgrades than its loadout value. A list of all ships' loadout
  > values is available at: www.xwing.life/resources

- Some standard loadout pilots have fixed upgrade cards; others simply have slots.
- Follow-up: Q17.

**Q17. Does loadout value cap the number of upgrade cards, or the total of their point costs?**

- The total of their point costs.
- Upgrades are also limited by slots: each upgrade needs a slot of its type. A pilot's slots can
  change during the points and playtesting cycle.
- Example: a pilot with one Modification slot, one Talent slot, and 17 loadout can equip only
  one Modification, however cheap. If it equips a 12-point Talent, its Modification can cost at
  most 5.

**Q8. Who approves publishing a version, and how many people edit points?**

- The points team lead(s) approve publishing a version.
- Eventually the app needs an admin role that can assign other roles.

### Playtesting

**Q10. Are draft points confidential?**

- Technically yes, but testers could leak them if they chose to; that is not something the app
  can prevent.
- Testers must be able to export their lists as XWS, to load them into Tabletop Simulator's
  X-Wing mod.

**Q11. During a playtest round, do drafts change mid-round?**

- No. Each round is a fixed set of points until the next round.

### Rules and the restricted list

**Q12. Is the restricted list tied to a points version?**

- Yes.

**Q13. What can be restricted, and what does "restricted" mean?**

Defined in the
[XWA 50P listbuilding appendix](https://www.xwing.life/rules/50p-listbuilding-appendix.pdf):

> The Restricted List is a list of ships and upgrades that are legal for Standard Play, with
> limitations. During squad building, a total of ships and upgrades, with the same name, from the
> Restricted List can be included in a squad. This could be up to the number of copies of as
> indicated on the Restricted List which can be found within the Points Document at
> www.xwing.life/resources
>
> Standard Loadouts with the same named ability/upgrade would be included when counting number of
> restrictions

In short:

- Both ships and upgrades can be restricted. They stay legal, but each entry has a maximum number
  of copies per squad.
- Copies are counted by name, across ships and upgrades together.
- Standard loadout pilots count toward the limit if their loadout includes the restricted
  ability or upgrade.
- The list and its limits are published in the points document, with the columns
  `Faction, Kind, Ship/Type, Name, Restricted` (`Restricted` is the maximum copies allowed).
  Follow-up: Q18.

**Q18. How do the faction, kind, and ship/type columns of a restricted list entry affect
counting?**

- An entry with a specific faction applies only to lists of that faction; `Generic` applies to
  all factions.
- Counting is by name across pilots and upgrades, whatever the entry's kind. It works like the
  `unique` restriction (a "Han Solo" pilot and a "Han Solo" crew upgrade both count), except the
  restricted list can allow more than one copy.

**Q14. Are other new list-building rules planned?**

- New rules should be expected eventually, but none are ready to announce, even internally.

### Formats

**Q15. Which formats does XWA support?**

- XWA does not distinguish between Standard and Extended.
- Epic is its own format, but uses the same points and restricted list.
