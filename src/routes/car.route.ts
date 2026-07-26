import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { adminOnly } from "../middlewares/admin.middleware";
import { upload } from "../middlewares/upload.middleware";
import { bookCar, deleteMyCar, getWishlist, toggleSaveCar } from "../controllers/car.controller";
import { getAllCarsAdmin, updateCarAdmin } from "../controllers/admin-car.controller";
import {
  createCar,
  getApprovedCars,
  getCarById,
  getMyCarById,
  getMyCars,

  getPendingCars,
  updateCarStatus,
} from "../controllers/car.controller";

const router = Router();

// Public
router.get("/", getApprovedCars);
router.get("/:id", getCarById);

// Authenticated user
router.post(
  "/",
  authorize,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "blueBookImage", maxCount: 1 },
  ]),
  createCar
);
router.get("/mine/list", authorize, getMyCars);
router.get("/mine/:id", authorize, getMyCarById);

// Admin only
router.get("/admin/pending", adminOnly, getPendingCars);
router.patch("/:id/status", adminOnly, updateCarStatus);
//cars
router.delete("/mine/:id", authorize, deleteMyCar);
router.post("/:id/book", authorize, bookCar);
router.post("/:id/save", authorize, toggleSaveCar);
router.get("/wishlist/mine", authorize, getWishlist);
router.get("/admin/all", adminOnly, getAllCarsAdmin);
router.patch("/admin/:id/edit", adminOnly, updateCarAdmin);

export default router;