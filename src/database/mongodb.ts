import mongoose from 'mongoose';
import { CONSTANTS } from '../configs/constant';

export async function connectDb(): Promise<void> {
  await mongoose.connect(CONSTANTS.MONGODB_URI);
  console.log('MongoDB connected');
}