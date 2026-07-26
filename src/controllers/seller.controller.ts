import { Response } from "express";
import Car, { ICar } from "../models/car.model";
import { AuthRequest } from "../middlewares/authorized.middleware";

/** Maps a raw Car document to the shape the seller dashboard UI expects. */
function toSellerListingDTO(car: ICar & { _id: any }) {
  const status: "active" | "pending" | "booked" | "sold" = car.soldAt
    ? "sold"
    : car.isBooked
    ? "booked"
    : car.status === "active"
    ? "active"
    : "pending"; // "pending" and "rejected" both surface as Pending to the seller

  const marketTimeDays = car.soldAt
    ? Math.round(
        (new Date(car.soldAt).getTime() - new Date(car.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : undefined;

  return {
    _id: car._id,
    title: `${car.year} ${car.make} ${car.carModel}`,
    vin: car.vin,
    image: car.images?.[0],
    status,
    price: car.soldPrice ?? car.price,
    marketAvg: car.marketAvgPrice,
    finalSale: car.soldPrice,
    saves: car.saves,
    photosPublished: (car.images?.length ?? 0) > 0,
    soldOn: car.soldAt,
    marketTimeDays,
    bookedOn: car.bookedAt,
    depositAmount: car.depositAmount,
    createdAt: car.createdAt,
    rejectionReason: car.rejectionReason, // surfaced but not yet shown in the UI
  };
}

/**
 * GET /api/v1/seller/stats
 */
export async function getSellerStats(req: AuthRequest, res: Response) {
  try {
    const sellerId = req.userId!;
    const cars = await Car.find({ sellerId }).lean();

    const active = cars.filter(
      (c) => c.status === "active" && !c.soldAt && !c.isBooked
    );
    const sold = cars.filter((c) => !!c.soldAt);

    const totalSaves = cars.reduce((sum, c) => sum + (c.saves ?? 0), 0);

    const avgDaysToSell = sold.length
      ? Math.round(
          sold.reduce(
            (sum, c) =>
              sum +
              (new Date(c.soldAt!).getTime() -
                new Date(c.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            0
          ) / sold.length
        )
      : 0;

    res.json({
      totalSaves,
      // TODO: no Offer/Bid model exists yet — wire this up once one does.
      pendingOffers: 0,
      pendingOffersNeedingReview: 0,
      activeListings: active.length,
      inventoryHealth: active.length > 0 ? "Optimal" : "Needs attention",
      avgDaysToSell,
      avgDaysToSellPercentile: 5, // TODO: needs a regional benchmark to compute for real
    });
  } catch (err) {
    console.error("getSellerStats error:", err);
    res.status(500).json({ message: "Failed to load seller stats" });
  }
}

/**
 * GET /api/v1/seller/listings?search=&status=
 */
export async function getSellerListings(req: AuthRequest, res: Response) {
  try {
    const sellerId = req.userId!;
    const { search, status } = req.query as { search?: string; status?: string };

    const query: Record<string, unknown> = { sellerId };

    if (status === "sold") query.soldAt = { $exists: true };
    if (status === "active") {
      query.status = "active";
      query.isBooked = { $ne: true };
      query.soldAt = { $exists: false };
    }
    if (status === "booked") {
      query.isBooked = true;
      query.soldAt = { $exists: false };
    }
    if (status === "pending") {
      query.status = { $in: ["pending", "rejected"] };
      query.soldAt = { $exists: false };
    }

    if (search) {
      query.$or = [
        { vin: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { carModel: { $regex: search, $options: "i" } },
      ];
    }

    const cars = await Car.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      listings: cars.map((c) => toSellerListingDTO(c as any)),
      total: cars.length,
    });
  } catch (err) {
    console.error("getSellerListings error:", err);
    res.status(500).json({ message: "Failed to load listings" });
  }
}

/**
 * PATCH /api/v1/seller/listings/:id/resume
 * Re-submits a rejected/pending draft for review (moves it back toward "pending").
 */
export async function resumeListing(req: AuthRequest, res: Response) {
  try {
    const sellerId = req.userId!;
    const { id } = req.params;

    const car = await Car.findOneAndUpdate(
      { _id: id, sellerId, status: { $in: ["pending", "rejected"] } },
      { status: "pending", rejectionReason: undefined },
      { new: true }
    );

    if (!car) {
      return res.status(404).json({ message: "Draft listing not found" });
    }

    res.json({ success: true, listing: toSellerListingDTO(car) });
  } catch (err) {
    console.error("resumeListing error:", err);
    res.status(500).json({ message: "Failed to resume listing" });
  }
}

/**
 * DELETE /api/v1/seller/listings/:id
 * Allowed for pending, rejected, or active listings — never once booked or sold.
 */
export async function deleteListing(req: AuthRequest, res: Response) {
  try {
    const sellerId = req.userId!;
    const { id } = req.params;

    const car = await Car.findOneAndDelete({
      _id: id,
      sellerId,
      isBooked: { $ne: true },
      soldAt: { $exists: false },
    });

    if (!car) {
      return res
        .status(404)
        .json({ message: "Listing not found or cannot be deleted" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("deleteListing error:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
}