import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Car from "../models/car.model";
import Booking from "../models/booking.model";
import Notification from "../models/notification.model";
import { calculateBookingDeposit } from "../utils/commission";
import { AuthRequest } from "../middlewares/authorized.middleware";

const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function generateEsewaSignature({
  total_amount,
  transaction_uuid,
  product_code,
}: {
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
}) {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY!)
    .update(message)
    .digest("base64");
}

// POST /api/v1/bookings — create a booking + return eSewa payment form fields
export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const { carId } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });
    if (car.isBooked) return res.status(409).json({ message: "This car is already booked" });
    if (car.soldAt) return res.status(409).json({ message: "This car has already been sold" });

    const { rate, depositAmount, commissionAmount } = calculateBookingDeposit(car.price);
    const transactionUuid = uuidv4();

    const booking = await Booking.create({
      carId: car._id,
      buyerId: req.userId,
      carPrice: car.price,
      depositAmount,
      commissionRate: rate,
      commissionAmount,
      transactionUuid,
      status: "pending_payment",
    });

    const signature = generateEsewaSignature({
      total_amount: depositAmount,
      transaction_uuid: transactionUuid,
      product_code: process.env.ESEWA_PRODUCT_CODE!,
    });

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      esewaPayload: {
        amount: depositAmount,
        tax_amount: 0,
        total_amount: depositAmount,
        transaction_uuid: transactionUuid,
        product_code: process.env.ESEWA_PRODUCT_CODE,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${process.env.APP_BASE_URL}/api/v1/bookings/verify`,
        failure_url: `${process.env.APP_BASE_URL}/api/v1/bookings/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
      gatewayUrl: process.env.ESEWA_GATEWAY_URL,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking", error: (err as Error).message });
  }
}

// GET /api/v1/bookings/verify?data=... — eSewa redirects the buyer's browser here
export async function verifyBooking(req: Request, res: Response) {
  try {
    const { data } = req.query as { data?: string };
    if (!data) {
      return res.redirect(`${FRONTEND_BASE_URL}/booking/failure`);
    }

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { transaction_uuid, total_amount, status } = decoded;

    const booking = await Booking.findOne({ transactionUuid: transaction_uuid });
    if (!booking) {
      return res.redirect(`${FRONTEND_BASE_URL}/booking/failure`);
    }

    if (status !== "COMPLETE") {
      return res.redirect(`${FRONTEND_BASE_URL}/booking/failure?bookingId=${booking._id}`);
    }

    // Double-check with eSewa's own status API using the exact amount they confirmed
    const statusRes = await axios.get(process.env.ESEWA_STATUS_URL!, {
      params: {
        product_code: process.env.ESEWA_PRODUCT_CODE,
        total_amount,
        transaction_uuid,
      },
    });

    if (statusRes.data.status !== "COMPLETE") {
      return res.redirect(`${FRONTEND_BASE_URL}/booking/failure?bookingId=${booking._id}`);
    }

    booking.status = "deposit_paid";
    await booking.save();

    const updatedCar = await Car.findByIdAndUpdate(
      booking.carId,
      {
        isBooked: true,
        bookedAt: new Date(),
        depositAmount: booking.depositAmount,
        buyerId: booking.buyerId,
      },
      { new: true }
    );

    if (updatedCar) {
      await Notification.create([
        {
          userId: booking.buyerId,
          carId: booking.carId,
          type: "deposit_paid_buyer",
          message: `Your deposit was received. A test drive for the ${updatedCar.year} ${updatedCar.make} ${updatedCar.carModel} will be arranged soon.`,
        },
        {
          userId: updatedCar.sellerId,
          carId: booking.carId,
          type: "deposit_paid_seller",
          message: `A buyer paid a deposit on your ${updatedCar.year} ${updatedCar.make} ${updatedCar.carModel}. It's now reserved pending test drive.`,
        },
      ]);
    }

    return res.redirect(`${FRONTEND_BASE_URL}/booking/success?bookingId=${booking._id}`);
  } catch (err) {
    console.error("verifyBooking error:", err);
    return res.redirect(`${FRONTEND_BASE_URL}/booking/failure`);
  }
}

// GET /api/v1/bookings/failure — eSewa redirects here on a failed/cancelled payment
export async function bookingFailure(_req: Request, res: Response) {
  return res.redirect(`${FRONTEND_BASE_URL}/booking/failure`);
}

// PATCH /api/v1/bookings/:id/cancel — cancel after test drive, refund minus flat expense
export async function cancelBooking(req: AuthRequest, res: Response) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const refundAmount = booking.depositAmount - booking.expenseDeducted;
    booking.status = "cancelled_refunded";
    booking.refundAmount = refundAmount;
    await booking.save();

    const car = await Car.findByIdAndUpdate(
      booking.carId,
      {
        $set: { isBooked: false },
        $unset: { bookedAt: "", depositAmount: "", buyerId: "" },
      },
      { new: true }
    );

    if (car) {
      await Notification.create([
        {
          userId: booking.buyerId,
          carId: booking.carId,
          type: "booking_cancelled_buyer",
          message: `Your booking for the ${car.year} ${car.make} ${car.carModel} was cancelled. Rs.${refundAmount.toLocaleString()} will be refunded.`,
        },
        {
          userId: car.sellerId,
          carId: booking.carId,
          type: "booking_cancelled_seller",
          message: `The booking on your ${car.year} ${car.make} ${car.carModel} was cancelled — it's active again.`,
        },
      ]);
    }

    res.json({ success: true, status: "cancelled_refunded", refundAmount, booking });
  } catch (err) {
    console.error("cancelBooking error:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
}

// PATCH /api/v1/bookings/:id/complete — buyer liked the car, full purchase finalized
export async function completeBooking(req: AuthRequest, res: Response) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const updatedCar = await Car.findByIdAndUpdate(
      booking.carId,
      {
        soldAt: new Date(),
        soldPrice: booking.carPrice,
        isBooked: false,
        buyerId: booking.buyerId,
      },
      { new: true }
    );

    if (updatedCar) {
      await Notification.create([
        {
          userId: booking.buyerId,
          carId: booking.carId,
          type: "sale_completed_buyer",
          message: `Congratulations! Your purchase of the ${updatedCar.year} ${updatedCar.make} ${updatedCar.carModel} is complete.`,
        },
        {
          userId: updatedCar.sellerId,
          carId: booking.carId,
          type: "sale_completed_seller",
          message: `Your ${updatedCar.year} ${updatedCar.make} ${updatedCar.carModel} has been sold.`,
        },
      ]);
    }

    res.json({ success: true, status: "completed", booking });
  } catch (err) {
    console.error("completeBooking error:", err);
    res.status(500).json({ message: "Failed to complete booking" });
  }
}