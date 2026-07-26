import { Response } from "express";
import Car from "../models/car.model";
import { AuthRequest } from "../middlewares/authorized.middleware";

// GET /api/v1/cars/admin/all?page=&limit=&search=&status=
export async function getAllCarsAdmin(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const { search, status } = req.query as { search?: string; status?: string };

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: "i" } },
        { carModel: { $regex: search, $options: "i" } },
        { vin: { $regex: search, $options: "i" } },
      ];
    }

    const [cars, total] = await Promise.all([
      Car.find(query)
        .populate("sellerId", "fullName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Car.countDocuments(query),
    ]);

    res.json({
      data: cars,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("getAllCarsAdmin error:", err);
    res.status(500).json({ message: "Failed to fetch cars" });
  }
}

// PATCH /api/v1/cars/admin/:id/edit — admin fixes a typo/mistake in any listing field
const EDITABLE_FIELDS = [
  "vin",
  "year",
  "make",
  "carModel",
  "bodyType",
  "mileage",
  "price",
  "location",
  "condition",
] as const;

export async function updateCarAdmin(req: AuthRequest, res: Response) {
  try {
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const car = await Car.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("sellerId", "fullName email");

    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    console.error("updateCarAdmin error:", err);
    res.status(500).json({ message: "Failed to update car", error: (err as Error).message });
  }
}