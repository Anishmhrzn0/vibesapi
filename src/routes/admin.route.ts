import { Router } from "express";
import { adminOnly } from "../middlewares/admin.middleware";
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/admin.controller";

const router = Router();

// All routes below require a valid JWT AND role === "admin"
router.use(adminOnly);

router.get("/users", listUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;