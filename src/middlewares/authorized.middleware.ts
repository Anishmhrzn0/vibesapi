  import { Request, Response, NextFunction } from "express";
  import jwt from "jsonwebtoken";
  import { CONSTANTS } from "../configs/constant";
  import { UserRepository } from "../repositories/user.repository";

  export interface AuthRequest extends Request {
    userId?: string;
  }

  interface JwtPayload {
    sub: string; 
  }

  const userRepository = new UserRepository();

  export const authorize = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies?.ap_token) {
        token = req.cookies.ap_token;
      }

      if (!token) {
        res.status(401).json({ success: false, message: "No token provided" });
        return;
      }

      const decoded = jwt.verify(token, CONSTANTS.JWT_SECRET) as JwtPayload;
      const user = await userRepository.findById(decoded.sub);

      if (!user) {
        res.status(401).json({ success: false, message: "User not found" });
        return;
      }

      req.userId = decoded.sub;
      next();
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };