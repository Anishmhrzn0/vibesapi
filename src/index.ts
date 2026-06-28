import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDb } from "./database/mongodb";

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});