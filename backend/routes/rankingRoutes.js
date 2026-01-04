import express from "express";
import { rankingPerStage } from "../controllers/rankingController.js";

const router = express.Router();

router.get("/:stage", rankingPerStage);

export default router;
