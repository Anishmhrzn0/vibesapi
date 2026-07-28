jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

import request from "supertest";
import app from "../../app";
import { createTestCar } from "../helpers/car";
import { createTestUser, createTestAdmin } from "../helpers/auth";
import Notification from "../../models/notification.model";
import { UserModel } from "../../models/user.model";

describe("Notification read state, admin editing, forgot password (integration)", () => {
  it("24. PATCH /api/v1/notifications/:id/read marks a single notification as read", async () => {
    const { user, token } = await createTestUser();
    const n = await Notification.create({ userId: user._id, type: "test", message: "Hi" });

    const res = await request(app)
      .patch(`/api/v1/notifications/${n._id}/read`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updated = await Notification.findById(n._id);
    expect(updated!.read).toBe(true);
  });

  it("25. PATCH /api/v1/notifications/read-all marks every unread notification as read", async () => {
    const { user, token } = await createTestUser();
    await Notification.create({ userId: user._id, type: "test", message: "One" });
    await Notification.create({ userId: user._id, type: "test", message: "Two" });

    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const unreadCount = await Notification.countDocuments({ userId: user._id, read: false });
    expect(unreadCount).toBe(0);
  });

  it("26. GET /api/v1/cars/admin/all returns 200 with cars for an admin user", async () => {
    const { user: seller } = await createTestUser();
    const { token: adminToken } = await createTestAdmin();
    await createTestCar({ sellerId: seller._id });

    const res = await request(app)
      .get("/api/v1/cars/admin/all")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("27. PATCH /api/v1/cars/admin/:id/edit updates a car's price as admin", async () => {
    const { user: seller } = await createTestUser();
    const { token: adminToken } = await createTestAdmin();
    const car = await createTestCar({ sellerId: seller._id, price: 1000000 });

    const res = await request(app)
      .patch(`/api/v1/cars/admin/${car._id}/edit`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 1200000 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(1200000);
  });

  it("28. PATCH /api/v1/cars/:id/status approves a pending car (status becomes active)", async () => {
    const { user: seller } = await createTestUser();
    const { token: adminToken } = await createTestAdmin();
    const car = await createTestCar({ sellerId: seller._id, status: "pending" });

    const res = await request(app)
      .patch(`/api/v1/cars/${car._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
  });

  it("29. POST /api/v1/auth/forgot-password returns a generic success message for an unknown email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "no-such-account@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("30. POST /api/v1/auth/forgot-password sets a reset token on a real user's account", async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: user.email });

    expect(res.status).toBe(200);
    const updated = await UserModel.findById(user._id).select("+resetPasswordToken +resetPasswordExpires");
    expect(updated!.resetPasswordToken).toBeDefined();
    expect(updated!.resetPasswordExpires).toBeDefined();
  });
});