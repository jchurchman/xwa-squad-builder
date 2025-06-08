import express from 'express';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'XWA Squad Builder API', status: 'ok' });
});

if (!isDev) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});