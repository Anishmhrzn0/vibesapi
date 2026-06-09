import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../validators/user.validator';
import { UserService } from '../services/user.service';
import { RegisterDto, LoginDto } from '../dtos/user.dto';
import { HttpException } from '../exceptions/http-exception';
import { sendSuccess, sendError } from '../utils/apihelper.util';

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // ── Validate ────────────────────────────────────────────────────────
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.issues[0].message, 400);
        return;
      }

      const result = await userService.register(parsed.data);
      sendSuccess(res, result, 'Account created successfully', 201);
    } catch (err) {
      if (err instanceof HttpException) {
        sendError(res, err.message, err.statusCode);
      } else {
        next(err);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // ── Validate ────────────────────────────────────────────────────────
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.issues[0].message, 400);
        return;
      }

      const result = await userService.login(parsed.data);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      if (err instanceof HttpException) {
        sendError(res, err.message, err.statusCode);
      } else {
        next(err);
      }
    }
  }
}