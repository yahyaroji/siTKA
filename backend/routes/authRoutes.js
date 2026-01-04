import express from "express";
import { loginUser, getUserProfile } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== LOGIN ==========
router.post("/login", loginUser);

// ========== GET USER PROFILE ==========
router.get("/profile/:id", authMiddleware, getUserProfile);

export default router;
