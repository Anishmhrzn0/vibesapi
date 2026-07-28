import { Router } from "express";
import { chatWithAssistant } from "../controllers/assistant.controller";

const router = Router();

// Public — no login required to chat with the assistant
router.post("/chat", chatWithAssistant);

export default router;