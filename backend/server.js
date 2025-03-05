import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import readingRoutes from "./routes/reading.route.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/readings", readingRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});
