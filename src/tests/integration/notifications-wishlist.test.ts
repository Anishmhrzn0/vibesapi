import request from "supertest";
import app from "../../app";
import { createTestCar } from "../helpers/car";
import { createTestUser } from "../helpers/auth";
import Notification from "../../models/notification.model";

describe("Wishlist, seller listings, purchases, notifications (integration)", () => {
  it("16. saving a car twice toggles it back off (unsave)", async () => {
    const { user: seller } = await createTestUser();
    const { token: buyerToken } = await createTestUser();
    const car = await createTestCar({ sellerId: seller._id });

    const first = await request(app)
      .post(`/api/v1/cars/${car._id}/save`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(first.body.saved).toBe(true);

    const second = await request(app)
      .post(`/api/v1/cars/${car._id}/save`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(second.body.saved).toBe(false);
  });

  it("17. GET /api/v1/seller/listings?status=booked returns only booked listings", async () => {
    const { user, token } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "active", isBooked: true });
    await createTestCar({ sellerId: user._id, status: "active", isBooked: false });

    const res = await request(app)
      .get("/api/v1/seller/listings?status=booked")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].status).toBe("booked");
  });

  it("18. PATCH /api/v1/seller/listings/:id/resume moves a rejected listing back to pending", async () => {
    const { user, token } = await createTestUser();
    const car = await createTestCar({ sellerId: user._id, status: "rejected" });

    const res = await request(app)
      .patch(`/api/v1/seller/listings/${car._id}/resume`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe("pending");
  });

  it("19. DELETE /api/v1/seller/listings/:id deletes the seller's own active listing", async () => {
    const { user, token } = await createTestUser();
    const car = await createTestCar({ sellerId: user._id, status: "active" });

    const res = await request(app)
      .delete(`/api/v1/seller/listings/${car._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("20. DELETE /api/v1/seller/listings/:id returns 404 for a booked listing", async () => {
    const { user, token } = await createTestUser();
    const car = await createTestCar({ sellerId: user._id, status: "active", isBooked: true });

    const res = await request(app)
      .delete(`/api/v1/seller/listings/${car._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("21. GET /api/v1/cars/purchases/mine returns cars where the user is the buyer", async () => {
    const { user: seller } = await createTestUser();
    const { user: buyer, token: buyerToken } = await createTestUser();
    await createTestCar({
      sellerId: seller._id,
      buyerId: buyer._id,
      isBooked: true,
      make: "Purchased Car",
    });
    await createTestCar({ sellerId: seller._id, make: "Unrelated Car" });

    const res = await request(app)
      .get("/api/v1/cars/purchases/mine")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe("Purchased Car");
  });

  it("22. GET /api/v1/notifications/mine returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/notifications/mine");
    expect(res.status).toBe(401);
  });

  it("23. GET /api/v1/notifications/mine returns only the authenticated user's notifications", async () => {
    const { user, token } = await createTestUser();
    const { user: otherUser } = await createTestUser();
    await Notification.create({ userId: user._id, type: "test", message: "For me" });
    await Notification.create({ userId: otherUser._id, type: "test", message: "Not for me" });

    const res = await request(app)
      .get("/api/v1/notifications/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].message).toBe("For me");
  });
});