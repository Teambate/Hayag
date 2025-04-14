import express from "express";
import { 
  generateInsights, 
  getInsights, 
  checkAndGenerateMissingInsights,
  getInsightReports
} from "../controller/insight.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/insights  
// Get insights for a specific device and date range
router.get("/", protect, getInsights);

// GET /api/insights/reports
// Get formatted insight reports for UI cards
router.get("/reports", protect, getInsightReports);

// GET & POST /api/insights/generate
// Generate insights for a specific device and date
router.route("/generate")
  .get(protect, generateInsights)
  .post(protect, generateInsights);

// GET & POST /api/insights/check-and-generate
// Check for missing insights and generate them
router.route("/check-and-generate")
  .get(protect, checkAndGenerateMissingInsights)
  .post(protect, checkAndGenerateMissingInsights);

export default router; 