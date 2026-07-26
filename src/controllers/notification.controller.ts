import { Response } from "express";
import Notification from "../models/notification.model";
import { AuthRequest } from "../middlewares/authorized.middleware";

// GET /api/v1/notifications/mine
export async function getMyNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
}

// PATCH /api/v1/notifications/:id/read
export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
}

// PATCH /api/v1/notifications/read-all
export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
}