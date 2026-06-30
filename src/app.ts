import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { CONSTANTS } from './configs/constant';
import userRoutes from './routes/user.route';
import authRoutes from './routes/auth.route'; 
import { sendError } from './utils/apihelper.util';
import adminRoutes from './routes/admin.route';

const app = express();

app.use(cors({ origin: CONSTANTS.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/admin', adminRoutes);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); 
// Routes
app.use('/api/users', userRoutes);
app.use('/api/v1/auth', authRoutes);  // ✅ add

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  sendError(res, 'Internal server error', 500);
});

export default app;