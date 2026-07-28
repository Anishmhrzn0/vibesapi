import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";
import { sendPasswordResetEmail } from "../utils/email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to check which emails are registered.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = `${FRONTEND_URL}/reset-password/${rawToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    res.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err: any) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ success: false, message: "Failed to process request" });
  }
};

// POST /api/v1/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.params.token);
    const { password } = req.body as { password?: string };

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      res.status(400).json({ success: false, message: "This reset link is invalid or has expired" });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};