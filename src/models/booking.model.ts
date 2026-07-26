import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  carId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  carPrice: number;
  depositAmount: number;
  commissionRate: number;
  commissionAmount: number;
  transactionUuid: string;
  status: "pending_payment" | "deposit_paid" | "cancelled_refunded" | "completed";
  refundAmount?: number;
  expenseDeducted: number;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carPrice: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    transactionUuid: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending_payment", "deposit_paid", "cancelled_refunded", "completed"],
      default: "pending_payment",
    },
    refundAmount: { type: Number },
    expenseDeducted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);