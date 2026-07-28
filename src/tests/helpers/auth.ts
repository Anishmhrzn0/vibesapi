import jwt from "jsonwebtoken";
import { CONSTANTS } from "../../configs/constant";
import { UserModel } from "../../models/user.model";

export async function createTestUser(overrides: Partial<any> = {}) {
  const user = await UserModel.create({
    fullName: "Test User",
    email: `test${Date.now()}${Math.random().toString(36).slice(2)}@example.com`,
    password: "not-used-directly-in-tests",
    role: "user",
    ...overrides,
  });

  const token = jwt.sign({ sub: user._id.toString() }, CONSTANTS.JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token };
}

export async function createTestAdmin() {
  return createTestUser({ role: "admin" });
}