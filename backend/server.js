import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import readingRoutes from "./routes/reading.route.js";
import authRoutes from "./routes/auth.route.js";
import insightRoutes from "./routes/insight.route.js";
import cors from "cors";
import path from "path";
import cron from "node-cron";
import { checkAndGenerateMissingInsightsService } from "./services/insight/insightService.js";
import User from "./model/user.model.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://hayag.onrender.com/",
    credentials: true
  }
});

const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://hayag.onrender.com/",
  credentials: true
}));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/insights", insightRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Subscribe to current sensor values for a device
  socket.on("subscribe", (deviceId) => {
    socket.join(`device:${deviceId}`);
    console.log(`Client ${socket.id} subscribed to device:${deviceId}`);
  });
  
  // Unsubscribe from current sensor values for a device
  socket.on("unsubscribe", (deviceId) => {
    socket.leave(`device:${deviceId}`);
    console.log(`Client ${socket.id} unsubscribed from device:${deviceId}`);
  });
  
  // Subscribe to chart updates for a specific device and chart type
  socket.on("subscribeChart", ({ deviceId, chartType }) => {
    socket.join(`device:${deviceId}:${chartType}`);
    console.log(`Client ${socket.id} subscribed to chart ${chartType} for device:${deviceId}`);
  });
  
  // Unsubscribe from chart updates for a specific device and chart type
  socket.on("unsubscribeChart", ({ deviceId, chartType }) => {
    socket.leave(`device:${deviceId}:${chartType}`);
    console.log(`Client ${socket.id} unsubscribed from chart ${chartType} for device:${deviceId}`);
  });
  
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API server is running',
    time: new Date().toISOString()
  });
});

// Serve static files in production mode
if(process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "frontend/dist")));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
  });
}

// Schedule daily insight generation job - runs at midnight every day
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily insight generation job');
  try {
    // Get all users with devices
    const users = await User.find({ 'devices.0': { $exists: true } });
    
    for (const user of users) {
      // Use the user's timezone or UTC if not set
      const timezone = user.timezone || 'Asia/Manila';
      
      // Process each device for this user
      for (const device of user.devices) {
        try {
          const result = await checkAndGenerateMissingInsightsService(device.deviceId, 1);
          console.log(`Generated insights for device ${device.deviceId}: ${result.daysGenerated} days processed`);
        } catch (error) {
          console.error(`Error generating insights for device ${device.deviceId}:`, error);
        }
      }
    }
    
    console.log('Completed daily insight generation job');
  } catch (error) {
    console.error('Error in daily insight generation job:', error);
  }
});

// Add this as a catch-all route handler at the bottom, but before app.listen
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.url}`
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});
