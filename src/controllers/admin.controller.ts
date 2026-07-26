import { Response } from "express";
import bcrypt from "bcryptjs";
import { AdminRequest } from "../middlewares/admin.middleware";
import { UserModel, UserRole } from "../models/user.model";
import { CONSTANTS } from "../configs/constant";

const toPublic = (u: any) => ({
  id:        u._id.toString(),
  fullName:  u.fullName,
  email:     u.email,
  phone:     u.phone,
  role:      u.role,
  bio:       u.bio,
  avatar:    u.avatar,
  createdAt: u.createdAt,
});

const ALLOWED_ROLES: UserRole[] = ["user", "admin"];

export const listUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = ((req.query.search as string) || "").trim();

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email:    { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      data: users.map(toPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("[GET /admin/users]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: toPublic(user) });
  } catch {
    res.status(400).json({ success: false, message: "Invalid user id" });
  }
};


export const createUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password, role = "user" } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: "fullName, email and password are required",
      });
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already in use" });
      return;
    }

    const hashed = await bcrypt.hash(password, CONSTANTS.SALT_ROUNDS);
    const user = await UserModel.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      role,
    });

    res.status(201).json({ success: true, data: toPublic(user) });
  } catch (err) {
    console.error("[POST /admin/users]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, role, bio, password } = req.body;
    const updates: Record<string, unknown> = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined)    updates.email = String(email).toLowerCase();
    if (phone !== undefined)    updates.phone = phone;
    if (bio !== undefined)      updates.bio = bio;

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        res.status(400).json({ success: false, message: "Invalid role" });
        return;
      }
      updates.role = role;
    }

    if (password) {
      updates.password = await bcrypt.hash(password, CONSTANTS.SALT_ROUNDS);
    }

    if (updates.email) {
      const clash = await UserModel.findOne({
        email: updates.email,
        _id: { $ne: req.params.id },
      });
      if (clash) {
        res.status(409).json({ success: false, message: "Email already in use" });
        return;
      }
    }

    const user = await UserModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: toPublic(user) });
  } catch (err) {
    console.error("[PUT /admin/users/:id] FULL ERROR:", err);   // ✅ add this
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/v1/admin/users/:id
export const deleteUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.userId) {
      res.status(400).json({ success: false, message: "You cannot delete your own account" });
      return;
    }

    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch {
    res.status(400).json({ success: false, message: "Invalid user id" });
  }
};