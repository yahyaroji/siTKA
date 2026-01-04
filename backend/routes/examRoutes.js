// examRoutes.js
import express from "express";
// import { startExam, getMyResult, getSoalBySession, submitBySession } from "../controllers/examController.js";
import { startExam, getSoalBySession, submitExam, getActiveSession } from "../controllers/examController.js";
import authMiddleware from "../middleware/authMiddleware.js";
// import { get } from "mongoose";

const router = express.Router();

// ✅ GET SOAL → TANPA TOKEN
router.post("/start", startExam);
router.get("/session/:sessionId/soal", authMiddleware, getSoalBySession);
// router.post("/session/:sessionId/submit", authMiddleware, submitBySession);

// ✅ SUBMIT → PAKAI TOKEN
router.post("/submit", submitExam);
// router.get("/result/:stage", authMiddleware, getMyResult);

// ✅ RESULT → PAKAI TOKEN
// router.get("/my-result", authMiddleware, getMyResult);

router.get("/exam/active-session", authMiddleware, getActiveSession);
export default router;
