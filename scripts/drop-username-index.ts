// scripts/drop-username-index.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { CONSTANTS } from "../src/configs/constant";

async function run() {
  await mongoose.connect(CONSTANTS.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB connection");

  const indexes = await db.collection("users").indexes();
  console.log("Current indexes:", indexes);

  await db.collection("users").dropIndex("username_1");
  console.log("✅ Dropped username_1 index");

  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});