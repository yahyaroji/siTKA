// examRoutes.js
import express from "express";
// import { startExam, getMyResult, getSoalBySession, submitBySession } from "../controllers/examController.js";
import { startExam, getSoalBySession, submitExam, getActiveSession, syncLiveProgress, getLiveMonitoring } from "../controllers/examController.js";
import authMiddleware from "../middleware/authMiddleware.js";
// import { get } from "mongoose";

const router = express.Router();

// ✅ GET SOAL → TANPA TOKEN
router.post("/start", startExam);
router.get("/session/:sessionId/soal", getSoalBySession);
// router.post("/session/:sessionId/submit", authMiddleware, submitBySession);

// ✅ SUBMIT → PAKAI TOKEN
router.post("/submit", submitExam);
// router.get("/result/:stage", authMiddleware, getMyResult);

// ✅ RESULT → PAKAI TOKEN
// router.get("/my-result", authMiddleware, getMyResult);

router.get("/exam/active-session", getActiveSession);

//fitur live score
// ✅ LIVE SYNC → PAKAI TOKEN (Bolt-on Feature)
router.patch("/sync-live", authMiddleware, syncLiveProgress);

// Pastikan kamu punya middleware admin
router.get("/monitoring/live", authMiddleware, getLiveMonitoring);
export default router;
