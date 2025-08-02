# Database Setup

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Installation

```bash
npm install
```

## Setup

Add this script to your `package.json`:

```json
{
  "scripts": {
    "seed": "tsx src/database/seed/seed.ts"
  }
}
```

## Running the Seed Script

Initialize and populate the database:

```bash
npm run seed
```

## What it does

1. **Fetches data** from YASB (Yet Another Squad Builder) repository
2. **Converts CoffeeScript** to JavaScript using decaffeinate
3. **Seeds database** with:
   - Platforms (ships)
   - Pilots with restrictions
   - Upgrades with restrictions
4. **Backfills pilot slots** based on upgrade compatibility

## Database Structure

The script populates these tables:

- `platforms` - Ship data
- `pilots` - Pilot cards with restrictions
- `upgrades` - Upgrade cards with restrictions
- `pilot_restrictions` - Pilot upgrade constraints
- `upgrade_restrictions` - Upgrade slot requirements

## Troubleshooting

- Check network connectivity for YASB data fetch
- Verify database initialization occurs before seeding
