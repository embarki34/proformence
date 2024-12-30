import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import identityRouter from './identeti/router';
import workersRouter from './workers/router';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Public routes
app.get('/', (_req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// Auth routes (no token needed)
app.use('/api/identity', identityRouter);
app.use('/api/workers', workersRouter);

// Protected routes - Add authenticateToken middleware
app.use('/api', authenticateToken);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
}); 