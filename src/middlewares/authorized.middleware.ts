import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONSTANTS } from '../configs/constant';
import { sendError } from '../utils/apihelper.util';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authorized(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized — no token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, CONSTANTS.JWT_SECRET) as { sub: string; email: string };
    req.userId    = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    sendError(res, 'Unauthorized — invalid or expired token', 401);
  }
}