import { calculateBookingDeposit } from "../../utils/commission";

describe("calculateBookingDeposit", () => {
  it("1. calculates a 10% deposit for a round price", () => {
    const { depositAmount } = calculateBookingDeposit(1000000);
    expect(depositAmount).toBe(100000);
  });

  it("2. calculates a 10% deposit for a smaller price", () => {
    const { depositAmount } = calculateBookingDeposit(50000);
    expect(depositAmount).toBe(5000);
  });

  it("3. rounds the deposit to the nearest whole number", () => {
    const { depositAmount } = calculateBookingDeposit(99999);
    expect(Number.isInteger(depositAmount)).toBe(true);
  });

  it("4. returns a rate of 0.1", () => {
    const { rate } = calculateBookingDeposit(500000);
    expect(rate).toBe(0.1);
  });

  it("5. sets commissionAmount equal to depositAmount", () => {
    const { depositAmount, commissionAmount } = calculateBookingDeposit(300000);
    expect(commissionAmount).toBe(depositAmount);
  });

  it("6. handles a price of zero without throwing", () => {
    expect(() => calculateBookingDeposit(0)).not.toThrow();
  });

  it("7. returns zero deposit for a price of zero", () => {
    const { depositAmount } = calculateBookingDeposit(0);
    expect(depositAmount).toBe(0);
  });

  it("8. scales linearly with price", () => {
    const a = calculateBookingDeposit(100000);
    const b = calculateBookingDeposit(200000);
    expect(b.depositAmount).toBe(a.depositAmount * 2);
  });

  it("9. handles very large prices without overflow", () => {
    const { depositAmount } = calculateBookingDeposit(50000000);
    expect(depositAmount).toBe(5000000);
  });

  it("10. always returns a positive deposit for a positive price", () => {
    const { depositAmount } = calculateBookingDeposit(123456);
    expect(depositAmount).toBeGreaterThan(0);
  });
});