// Deposit is a percentage of the car's price, held to reserve the vehicle
// for a test drive. Adjust DEPOSIT_RATE to your actual business rule.
const DEPOSIT_RATE = 0.1; // 10% of vehicle price

export function calculateBookingDeposit(carPrice: number) {
  const rate = DEPOSIT_RATE;
  const depositAmount = Math.round(carPrice * rate);
  const commissionAmount = depositAmount; // adjust if commission differs from deposit
  return { rate, depositAmount, commissionAmount };
}