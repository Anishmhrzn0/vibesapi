import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { UserModel } from "../src/models/user.model";
import { CONSTANTS } from "../src/configs/constant";

async function run() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  await mongoose.connect(CONSTANTS.MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await UserModel.updateOne(
    { email: email.toLowerCase() },
    { $set: { role: "admin" } }
  );

  if (result.matchedCount === 0) {
    console.error("No user found with email: " + email);
  } else {
    console.log("User " + email + " promoted to admin.");
    console.log(result);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
