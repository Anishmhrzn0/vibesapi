import { Response } from "express";
import Car from "../models/car.model";
import { AuthRequest } from "../middlewares/authorized.middleware";

// POST /api/cars — user creates a listing, always starts pending
export const createCar = async (req: AuthRequest, res: Response) => {
  try {
const { vin, year, make, carModel, bodyType, location, mileage, price, condition, blueBookNumber } = req.body;
    const filesByField = (req.files as { [field: string]: Express.Multer.File[] }) || {};
    const images = (filesByField.images || []).map((f) => f.path);
    const blueBookImage = filesByField.blueBookImage?.[0]?.path || "";

    const car = await Car.create({
  vin,
  year: Number(year),
  make,
  carModel,
  bodyType,
  location,
  mileage: Number(mileage),
  price: Number(price),
  condition: condition || "Excellent",
  images,
  blueBookNumber,
  blueBookImage,
  sellerId: req.userId,
  status: "pending",
});

    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: "Failed to create listing", error: (err as Error).message });
  }
};

// GET /api/cars — public, only approved cars
export const getApprovedCars = async (_req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({
      status: "active",
      isBooked: { $ne: true },
      soldAt: { $exists: false },
    }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cars", error: (err as Error).message });
  }
};

// GET /api/cars/:id — public, only approved cars
export const getCarById = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, status: "active" })
  .populate("sellerId", "fullName");
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch car", error: (err as Error).message });
  }
};

// GET /api/cars/mine/:id — owner viewing their own listing, any status
export const getMyCarById = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, sellerId: req.userId });
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch car", error: (err as Error).message });
  }
};

// GET /api/cars/mine/list — user's own listings, any status
export const getMyCars = async (req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({ sellerId: req.userId }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your listings", error: (err as Error).message });
  }
};

// GET /api/cars/admin/pending — admin only
export const getPendingCars = async (_req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({ status: "pending" })
      .populate("sellerId", "fullName")
      .sort({ createdAt: 1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending cars", error: (err as Error).message });
  }
};

// PATCH /api/cars/:id/status — admin only
export const updateCarStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["active", "rejected"].includes(status)) {
  return res.status(400).json({ message: "Invalid status" });
}

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: status === "rejected" ? rejectionReason : undefined },
      { new: true }
    );

    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: (err as Error).message });
  }
};

// DELETE /api/cars/mine/:id — owner deletes their own listing
export const deleteMyCar = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, sellerId: req.userId });
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listing", error: (err as Error).message });
  }
};
// POST /api/cars/:id/book — buyer reserves a car with a deposit
export const bookCar = async (req: AuthRequest, res: Response) => {
  try {
    const { depositAmount } = req.body;
    if (!depositAmount || Number(depositAmount) <= 0) {
      return res.status(400).json({ message: "A valid deposit amount is required" });
    }

    const car = await Car.findOne({ _id: req.params.id, status: "active" });
    if (!car) return res.status(404).json({ message: "Car not found" });
    if (car.isBooked) return res.status(409).json({ message: "This car is already booked" });
    if (car.soldAt) return res.status(409).json({ message: "This car has already been sold" });

    car.isBooked = true;
    car.bookedAt = new Date();
    car.depositAmount = Number(depositAmount);
    car.buyerId = req.userId as any;
    await car.save();

    res.json(car);
  } catch (err) {
    res.status(500).json({ message: "Failed to book car", error: (err as Error).message });
  }
};
// POST /api/cars/:id/save — toggle wishlist for the logged-in user
export const toggleSaveCar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const car = await Car.findById(req.params.id).select("savedBy saves");
    if (!car) return res.status(404).json({ message: "Car not found" });

    const alreadySaved = car.savedBy.some((id) => id.toString() === userId);

    const updated = await Car.findByIdAndUpdate(
      req.params.id,
      alreadySaved
        ? { $pull: { savedBy: userId }, $inc: { saves: -1 } }
        : { $addToSet: { savedBy: userId }, $inc: { saves: 1 } },
      { new: true, runValidators: false }
    ).select("saves");

    res.json({ saved: !alreadySaved, saves: updated!.saves });
  } catch (err) {
    console.error("toggleSaveCar error:", err);
    res.status(500).json({ message: "Failed to update wishlist", error: (err as Error).message });
  }
};
// GET /api/cars/wishlist/mine — cars the logged-in user has saved
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({ savedBy: req.userId }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    console.error("getWishlist error:", err);
    res.status(500).json({ message: "Failed to fetch wishlist", error: (err as Error).message });
  }
};