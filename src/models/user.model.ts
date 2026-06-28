// src/models/user.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone:    { type: String },
    bio:      { type: String },
    avatar:   { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);