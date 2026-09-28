import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './auth.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the Node backend!' });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
