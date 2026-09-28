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

// Express 5 passes listen errors (e.g. EADDRINUSE) to this callback instead of throwing.
app.listen(config.port, (err) => {
  if (err) {
    console.error(`Backend could not start on port ${config.port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`Backend listening on http://localhost:${config.port}`);
});
