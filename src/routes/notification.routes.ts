import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller";

const router = Router();

router.use(authorize);
router.get("/mine", getMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;