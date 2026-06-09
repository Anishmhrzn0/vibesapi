import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CONSTANTS } from './configs/constant';
import userRoutes from './routes/user.route';
import { sendError } from './utils/apihelper.util';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: CONSTANTS.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/users', userRoutes);

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  sendError(res, 'Internal server error', 500);
});

export default app;