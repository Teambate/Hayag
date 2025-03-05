import express from "express";
import { createReading, getReadings } from "../controller/reading.controller.js";

const router = express.Router();

router.get("/", getReadings);
router.post("/", createReading);

export default router;
