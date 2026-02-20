import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'appointment-service', status: 'healthy' });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`appointment-service running on port ${PORT}`);
});
