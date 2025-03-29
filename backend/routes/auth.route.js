import express from "express";
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword,
  addUserDevice 
} from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.post("/devices", protect, addUserDevice);

export default router; 