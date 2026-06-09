import { Schema } from 'mongoose';

// Shared base fields reused across models
export const personSchema = {
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, required: true, trim: true },
};