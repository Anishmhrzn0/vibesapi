import request from "supertest";
import app from "../../app";
import { createTestCar } from "../helpers/car";
import { createTestUser } from "../helpers/auth";

describe("Public car endpoints (integration)", () => {
  it("1. GET /api/v1/cars returns an empty array when there are no active cars", async () => {
    const res = await request(app).get("/api/v1/cars");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("2. GET /api/v1/cars excludes pending cars", async () => {
    const { user } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "pending" });

    const res = await request(app).get("/api/v1/cars");
    expect(res.body).toHaveLength(0);
  });

  it("3. GET /api/v1/cars excludes booked cars", async () => {
    const { user } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "active", isBooked: true });

    const res = await request(app).get("/api/v1/cars");
    expect(res.body).toHaveLength(0);
  });

  it("4. GET /api/v1/cars excludes sold cars", async () => {
    const { user } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "active", soldAt: new Date() });

    const res = await request(app).get("/api/v1/cars");
    expect(res.body).toHaveLength(0);
  });

  it("5. GET /api/v1/cars returns active, unbooked, unsold cars", async () => {
    const { user } = await createTestUser();
    await createTestCar({ sellerId: user._id, status: "active", make: "Honda" });

    const res = await request(app).get("/api/v1/cars");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe("Honda");
  });

  it("6. GET /api/v1/cars/:id returns 404 for a nonexistent id", async () => {
    const res = await request(app).get("/api/v1/cars/64b6f7f7f7f7f7f7f7f7f7f7");
    expect(res.status).toBe(404);
  });

  it("7. GET /api/v1/cars/:id returns 404 for a car that isn't active (e.g. pending)", async () => {
    const { user } = await createTestUser();
    const car = await createTestCar({ sellerId: user._id, status: "pending" });

    const res = await request(app).get(`/api/v1/cars/${car._id}`);
    expect(res.status).toBe(404);
  });

  it("8. GET /api/v1/cars/:id returns full details for an active car", async () => {
    const { user } = await createTestUser();
    const car = await createTestCar({ sellerId: user._id, status: "active", make: "Mazda" });

    const res = await request(app).get(`/api/v1/cars/${car._id}`);
    expect(res.status).toBe(200);
    expect(res.body.make).toBe("Mazda");
  });
});