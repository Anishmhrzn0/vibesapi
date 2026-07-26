import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  getSellerStats,
  getSellerListings,
  resumeListing,
  deleteListing,
} from "../controllers/seller.controller";

const router = Router();


router.use(authorize);

router.get("/stats", getSellerStats);
router.get("/listings", getSellerListings);
router.patch("/listings/:id/resume", resumeListing);
router.delete("/listings/:id", deleteListing);

export default router;