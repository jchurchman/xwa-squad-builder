import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';

import {
  initializeDatabase,
  PilotRepository,
  PlatformRepository,
  UpgradeRepository,
} from './database/database';

import type { Faction } from '@shared/types';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

initializeDatabase();
const platformRepo = new PlatformRepository();
const pilotRepo = new PilotRepository();
const upgradeRepo = new UpgradeRepository();

app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'XWA Squad Builder API', status: 'ok' });
});

app.get('/api/platforms/all', (req: Request, res: Response) => {
  try {
    const platforms = platformRepo.findAll();
    res.json(platforms);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch all platforms: ${error}` });
  }
});

app.get('/api/pilots/all', (req: Request, res: Response) => {
  try {
    const pilots = pilotRepo.findAll();
    res.json(pilots);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch all pilots: ${error}` });
  }
});

app.get('/api/upgrades/all', (req: Request, res: Response) => {
  try {
    const upgrades = upgradeRepo.findAll();
    res.json(upgrades);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch all upgrades: ${error}` });
  }
});

app.get('/api/platforms', (req: Request, res: Response) => {
  try {
    const { faction } = req.query;

    if (!faction) {
      res.status(400).json({ error: 'Faction parameter required' });
      return;
    }

    const platforms = platformRepo.findByFaction(faction as string);
    res.json(platforms);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch platforms: ${error}` });
  }
});

app.get('/api/pilots', (req: Request, res: Response) => {
  try {
    const { platform } = req.query;

    if (!platform) {
      res.status(400).json({ error: 'Platform parameter required' });
      return;
    }

    const pilots = pilotRepo.findByPlatform(platform as string);
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
      return upgrade.upgradeRestrictions.faction.includes(faction as Faction);
    });

    res.json(upgrades);
  } catch (error: unknown) {
    res.status(500).json({ error: `Failed to fetch upgrades: ${error}` });
  }
});

app.get('/api/platforms/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid platform ID' });
      return;
    }

    const platform = platformRepo.findById(id);

    if (!platform) {
      res.status(404).json({ error: 'Platform not found' });
      return;
    }

    res.json(platform);
  } catch (error: unknown) {
    res.status(500).json({
      error: `Failed to fetch platform details: ${error}`,
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
