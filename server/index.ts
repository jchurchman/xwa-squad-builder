import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({ message: 'XWA Squad Builder API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});