// src/models/user.model.ts
import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "admin";
export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role : UserRole;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone:    { type: String },
    bio:      { type: String },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
    avatar:   { type: String },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
