import { toSellerListingDTO } from "../../controllers/seller.controller";

function makeCar(overrides: Partial<any> = {}) {
  return {
    _id: "car123",
    year: 2020,
    make: "Toyota",
    carModel: "Corolla",
    vin: "VIN123",
    images: ["https://example.com/img.jpg"],
    status: "active",
    price: 1000000,
    soldPrice: undefined,
    marketAvgPrice: 950000,
    views: 10,
    saves: 2,
    soldAt: undefined,
    createdAt: new Date("2026-01-01"),
    isBooked: false,
    bookedAt: undefined,
    depositAmount: undefined,
    rejectionReason: undefined,
    ...overrides,
  };
}

describe("toSellerListingDTO", () => {
  it("11. maps status 'active' + not booked/sold to 'active'", () => {
    const dto = toSellerListingDTO(makeCar({ status: "active" }) as any);
    expect(dto.status).toBe("active");
  });

  it("12. maps status 'pending' to 'pending'", () => {
    const dto = toSellerListingDTO(makeCar({ status: "pending" }) as any);
    expect(dto.status).toBe("pending");
  });

  it("13. maps status 'rejected' to 'pending' (both surface as Pending)", () => {
    const dto = toSellerListingDTO(makeCar({ status: "rejected" }) as any);
    expect(dto.status).toBe("pending");
  });

  it("14. maps isBooked:true to 'booked', overriding an 'active' status", () => {
    const dto = toSellerListingDTO(makeCar({ status: "active", isBooked: true }) as any);
    expect(dto.status).toBe("booked");
  });

  it("15. maps soldAt present to 'sold', taking priority over isBooked", () => {
    const dto = toSellerListingDTO(
      makeCar({ isBooked: true, soldAt: new Date("2026-02-01") }) as any
    );
    expect(dto.status).toBe("sold");
  });

  it("16. composes the title from year, make, and carModel", () => {
    const dto = toSellerListingDTO(
      makeCar({ year: 2019, make: "Honda", carModel: "Civic" }) as any
    );
    expect(dto.title).toBe("2019 Honda Civic");
  });

  it("17. uses soldPrice over price when the car is sold", () => {
    const dto = toSellerListingDTO(
      makeCar({ soldAt: new Date(), soldPrice: 900000, price: 1000000 }) as any
    );
    expect(dto.price).toBe(900000);
  });

  it("18. falls back to price when soldPrice is not set", () => {
    const dto = toSellerListingDTO(makeCar({ price: 1000000, soldPrice: undefined }) as any);
    expect(dto.price).toBe(1000000);
  });

  it("19. computes marketTimeDays as the gap between createdAt and soldAt", () => {
    const dto = toSellerListingDTO(
      makeCar({
        createdAt: new Date("2026-01-01"),
        soldAt: new Date("2026-01-11"),
      }) as any
    );
    expect(dto.marketTimeDays).toBe(10);
  });

  it("20. sets photosPublished to false when there are no images", () => {
    const dto = toSellerListingDTO(makeCar({ images: [] }) as any);
    expect(dto.photosPublished).toBe(false);
  });
});