import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import identityRouter from './identeti/router';
import workersRouter from './workers/router';
import { authenticateToken } from './middleware/auth';
import likesRouter from './likes/router';
import statesRouter from './states/router';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Public routes
app.get('/', (_req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// Public routes
app.use('/public/likes', likesRouter);
app.use('/api/identity', identityRouter);


// Protected routes - Apply authentication middleware after public routes
app.use('/api/workers', authenticateToken, workersRouter);
app.use('/api/states', authenticateToken, statesRouter);
// Add other protected routes here

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});