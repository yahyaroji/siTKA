import express from "express";
import { getMyResult } from "../controllers/examResultController.js";
// import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ambil semua hasil ujian milik siswa login
router.get("/me", getMyResult);

export default router;
