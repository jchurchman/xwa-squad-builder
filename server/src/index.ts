import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';

import {
  initializeDatabase,
  PilotRepository,
  ShipRepository,
  UpgradeRepository,
} from './database/database';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

initializeDatabase();
const shipRepo = new ShipRepository();
const pilotRepo = new PilotRepository();
const upgradeRepo = new UpgradeRepository();

app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173'
}));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'XWA Squad Builder API', status: 'ok' });
});

app.get('/api/ships', (req: Request, res: Response) => {
  try {
    const { faction } = req.query;

    if (!faction) {
      res.status(400).json({ error: 'Faction parameter required' });
      return;
    }

    const ships = shipRepo.findByFaction(faction as string);
    res.json(ships);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch ships: ${error}` });
  }
});

app.get('/api/pilots', (req: Request, res: Response) => {
  try {
    const { ship } = req.query;

    if (!ship) {
      res.status(400).json({ error: 'Ship parameter required' });
      return;
    }

    const pilots = pilotRepo.findByShip(ship as string);
    res.json(pilots);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch pilots: ${error}` });
  }
});

app.get('/api/upgrades', (req: Request, res: Response) => {
  try {
    const { faction, slot } = req.query;

    if (!slot) {
      res.status(400).json({ error: 'Slot parameter required' });
      return;
    }

    const upgrades = upgradeRepo.findByFirstSlot(slot as string).filter((upgrade) => {
      if (!faction) {
        return true;
      }
      if (!upgrade.upgradeRestrictions.faction) {
        return true;
      }
      return upgrade.upgradeRestrictions.faction.includes(faction as string);
    });

    res.json(upgrades);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch upgrades: ${error}` });
  }
});

app.get('/api/ships/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ship ID' });
      return;
    }

    const ship = shipRepo.findById(id);

    if (!ship) {
      res.status(404).json({ error: 'Ship not found' });
      return;
    }

    res.json(ship);
  } catch (error: unknown) {
    res.status(500).json({
      error: `Failed to fetch ship details: ${error}`,
    });
  }
});

app.get('/api/pilots/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid pilot ID' });
      return;
    }

    const pilot = pilotRepo.findById(id);

    if (!pilot) {
      res.status(404).json({ error: 'Pilot not found' });
      return;
    }

    res.json(pilot);
  } catch (error: unknown) {
    res.status(500).json({
      error: `Failed to fetch pilot details: ${error}`,
    });
  }
});

app.get('/api/upgrades/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid upgrade ID' });
      return;
    }

    const upgrade = upgradeRepo.findById(id);

    if (!upgrade) {
      res.status(404).json({ error: 'Upgrade not found' });
      return;
    }

    res.json(upgrade);
  } catch (error: unknown) {
    res.status(500).json({
      error: `Failed to fetch upgrade details: ${error}`,
    });
  }
});

if (!isDev) {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
