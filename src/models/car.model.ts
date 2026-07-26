import mongoose, { Schema, Document } from "mongoose";

export interface ICar extends Document {
  vin: string;
  year: number;
  make: string;
  carModel: string;
  bodyType: string;
  mileage: number;
  price: number;
  location: string;
  images: string[];
  blueBookNumber: string;
  blueBookImage: string;
  sellerId: mongoose.Types.ObjectId;
  status: "pending" | "active" | "rejected";
  rejectionReason?: string;
  condition: string;
  views: number; 
  viewsLastWeek: number; 
  saves: number; 
  marketAvgPrice?: number; 
  soldAt?: Date; 
  soldPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  isBooked: boolean;
  bookedAt?: Date;
  depositAmount?: number;
  buyerId?: mongoose.Types.ObjectId;
  savedBy: mongoose.Types.ObjectId[];
}

const carSchema = new Schema<ICar>(
  {
    vin: { type: String, required: true },
    year: { type: Number, required: true },
    make: { type: String, required: true },
    carModel: { type: String, required: true },
    bodyType: { type: String, required: true, default: "Sedan" },
    mileage: { type: Number, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, default: "" },
    condition: { type: String, required: true, default: "Excellent" },
    images: { type: [String], default: [] },
    blueBookNumber: { type: String, required: true },
    blueBookImage: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isBooked: { type: Boolean, default: false },
    bookedAt: { type: Date },
    depositAmount: { type: Number },
    buyerId: { type: Schema.Types.ObjectId, ref: "User" },
    saves: { type: Number, default: 0 },
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    

    
    status: {
  type: String,
  enum: ["pending", "active", "rejected"],
  default: "pending",
},
    views: { type: Number, default: 0 },
    viewsLastWeek: { type: Number, default: 0 },
    marketAvgPrice: { type: Number },
    soldAt: { type: Date },
    soldPrice: { type: Number },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICar>("Car", carSchema);