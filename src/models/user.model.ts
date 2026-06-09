import { Schema, model, models, Document } from 'mongoose';
import { personSchema } from '../person.model';


export interface IUserDocument extends Document {
  fullName:  string;
  email:     string;
  phone:     string;
  password:  string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    ...personSchema,
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = models.User ?? model<IUserDocument>('User', UserSchema);