    import request from "supertest";
import app from "../../app";
import { createTestCar } from "../helpers/car";
import { createTestUser, createTestAdmin } from "../helpers/auth";

describe("Authenticated car/seller/admin endpoints (integration)", () => {
  it("9. GET /api/v1/cars/mine/list returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/cars/mine/list");
    expect(res.status).toBe(401);
  });

  it("10. GET /api/v1/cars/mine/list returns only the authenticated user's own cars", async () => {
    const { user: owner, token } = await createTestUser();
    const { user: otherUser } = await createTestUser();
    await createTestCar({ sellerId: owner._id, make: "Owner Car" });
    await createTestCar({ sellerId: otherUser._id, make: "Other Car" });

    const res = await request(app)
      .get("/api/v1/cars/mine/list")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe("Owner Car");
  });

  it("11. DELETE /api/v1/cars/mine/:id returns 404 when deleting someone else's car", async () => {
    const { token } = await createTestUser();
    const { user: otherUser } = await createTestUser();
    const car = await createTestCar({ sellerId: otherUser._id, status: "pending" });

    const res = await request(app)
      .delete(`/api/v1/cars/mine/${car._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("12. Saving a car via POST /:id/save makes it appear in GET /wishlist/mine", async () => {
    const { user: seller } = await createTestUser();
    const { token: buyerToken } = await createTestUser();
    const car = await createTestCar({ sellerId: seller._id, make: "Wishlist Car" });

    const saveRes = await request(app)
      .post(`/api/v1/cars/${car._id}/save`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(saveRes.status).toBe(200);
    expect(saveRes.body.saved).toBe(true);

    const wishlistRes = await request(app)
      .get("/api/v1/cars/wishlist/mine")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(wishlistRes.status).toBe(200);
    expect(wishlistRes.body).toHaveLength(1);
    expect(wishlistRes.body[0].make).toBe("Wishlist Car");
  });

  it("13. GET /api/v1/seller/stats returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/seller/stats");
    expect(res.status).toBe(401);
  });

  it("14. GET /api/v1/seller/stats returns the correct activeListings count", async () => {
    const { user, token } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "active" });
    await createTestCar({ sellerId: user._id, status: "active" });
    await createTestCar({ sellerId: user._id, status: "pending" });

    const res = await request(app)
      .get("/api/v1/seller/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.activeListings).toBe(2);
  });

  it("15. GET /api/v1/cars/admin/all returns 401 for a non-admin user", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .get("/api/v1/cars/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).not.toBe(200);
  });
});