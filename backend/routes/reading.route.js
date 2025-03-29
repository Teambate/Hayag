import express from "express";
import { createReading, getReadings, getFilteredReadings, getCurrentSensorValues, getChartData, getDashboardChartData, getPanelIdsForDevice } from "../controller/reading.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected routes - accessible by authenticated users
router.get("/", protect, getReadings);
router.get("/filtered", protect, getFilteredReadings);
router.get("/current", protect, getCurrentSensorValues);
router.get("/chart", protect, getChartData);
router.get("/dashboard/chart", protect, getDashboardChartData);
router.get("/device/:deviceId/panels", protect, getPanelIdsForDevice);

// Protected routes - accessible only by admins
router.post("/", protect, admin, createReading);

export default router;
