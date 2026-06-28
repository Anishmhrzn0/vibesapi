// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middlewares/authorized.middleware";

const userService = new UserService();

// POST /api/v1/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/auth/whoami  [protected]
export const whoami = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.userId!);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/auth/update  [protected]
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.updateProfile(req.userId!, req.body, req.file);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};