import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONSTANTS } from "../configs/constant";
import { UserModel } from "../models/user.model";

export interface AdminRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
}

export const adminOnly = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, CONSTANTS.JWT_SECRET) as JwtPayload;

    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }

    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};  