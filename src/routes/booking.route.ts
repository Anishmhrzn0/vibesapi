import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  createBooking,
  verifyBooking,
  bookingFailure,
  cancelBooking,
  completeBooking,
} from "../controllers/booking.controller";

const router = Router();

router.post("/", authorize, createBooking);
router.get("/verify", verifyBooking); // public — hit by eSewa's browser redirect
router.get("/failure", bookingFailure); // public — hit by eSewa's browser redirect
router.patch("/:id/cancel", authorize, cancelBooking);
router.patch("/:id/complete", authorize, completeBooking);

export default router;