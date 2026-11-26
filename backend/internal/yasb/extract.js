// Prints YASB's XWA card data as JSON for the Go importer (see yasb.go). Run as
// `node - <yasb checkout>` with this script on stdin.
//
// It compiles YASB's card data from CoffeeScript in memory with YASB's own compiler and options,
// so nothing is written to disk, then runs YASB's setupCommonCardData to get each card's XWS ID.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const yasbPath = process.argv[2];
const read = (file) => fs.readFileSync(path.join(yasbPath, file), 'utf8');

const coffee = require(path.join(yasbPath, 'node_modules', 'coffeescript'));
// The same options as YASB's Gruntfile.
const js = coffee.compile(read('coffeescripts/content/cards-common.coffee'), { bare: true });

// setupCommonCardData uses this helper, which YASB defines in its browser-only xwing.coffee.
String.prototype.getXWSBaseName = function () {
  return this.split('-')[0];
};
const yasb = {};
vm.runInThisContext(`(function (exports) {\n${js}\n})`)(yasb);
const cards = yasb.basicCardData();
yasb.setupCommonCardData(cards);

// The points version YASB shows, e.g. "50P-2.1.1".
const versionInfo = read('coffeescripts/system/xwing.coffee').match(/versioninfo = "([^"]+)"/)?.[1];

const isCard = (card) => card.skip == null;
const output = {
  pilots: cards.pilotsById.filter(isCard).map((p) => ({
    cost: p.points,
    loadout: p.loadout ?? 0,
    slots: p.slots ?? [],
    // Standard loadout pilots list their fixed upgrades instead of slots.
    standardLoadout: p.upgrades != null,
    xws: p.xws,
  })),
  upgrades: cards.upgradesById.filter(isCard).map((u) => ({
    cost: u.points ?? null,
    // Standard-loadout-only: the upgrade only comes with a standard loadout pilot.
    standard: Boolean(u.standard),
    xws: u.xws,
  })),
  versionInfo,
};
process.stdout.write(JSON.stringify(output));
