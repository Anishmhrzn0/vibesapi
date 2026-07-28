import Car from "../../models/car.model";

export function makeCarData(overrides: Partial<any> = {}) {
  return {
    vin: `VIN${Date.now()}${Math.random().toString(36).slice(2)}`,
    year: 2020,
    make: "Toyota",
    carModel: "Corolla",
    bodyType: "Sedan",
    mileage: 20000,
    price: 1000000,
    blueBookNumber: `BB${Date.now()}`,
    blueBookImage: "https://example.com/bluebook.jpg",
    images: ["https://example.com/car.jpg"],
    location: "Kathmandu",
    status: "active",
    ...overrides,
  };
}

export async function createTestCar(overrides: Partial<any> = {}) {
  return Car.create(makeCarData(overrides) as any);
}