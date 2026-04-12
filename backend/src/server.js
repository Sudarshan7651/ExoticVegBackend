require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/database");

// Import models to initialize associations
require("./models");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const vegetableRoutes = require("./routes/vegetable.routes");
const orderRoutes = require("./routes/order.routes");
const specialOrderRoutes = require("./routes/specialOrder.routes");
const traderRoutes = require("./routes/trader.routes");
const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const savedTraderRoutes = require("./routes/savedTrader.routes");
const refundRoutes = require("./routes/refund.routes");
const reviewModerationRoutes = require("./routes/reviewModeration.routes");
const verificationRoutes = require("./routes/verification.routes");
const orderModificationRoutes = require("./routes/orderModification.routes");

const app = express();
const http = require("http").createServer(app);
const socketIO = require("./utils/socket");
socketIO.init(http);

const PORT = process.env.PORT || 3001;

// Connect to PostgreSQL
connectDB();

// Middleware
app.use(
  cors({ 
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Static files for uploads
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vegetables", vegetableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/special-orders", specialOrderRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/review-moderation", reviewModerationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/order-modifications", orderModificationRoutes);
app.use("/api/traders", traderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/saved-traders", savedTraderRoutes);

// Buyer dashboard route
const { auth } = require("./middleware/auth");
const userController = require("./controllers/user.controller");
app.get("/api/buyer/dashboard", auth, userController.getBuyerDashboard);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ExoticVeg360 API is running",
    database: "PostgreSQL",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "ExoticVeg360 API",
    version: "1.0.0",
    description: "Backend API for ExoticVeg360 mobile app",
    database: "PostgreSQL with Sequelize ORM",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      vegetables: "/api/vegetables",
      orders: "/api/orders",
      specialOrders: "/api/special-orders",
      traders: "/api/traders",
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);

  // Handle Sequelize errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: err.errors.map((e) => e.message).join(". "),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server - Listen on 0.0.0.0 to be accessible from other devices on the network
http.listen(PORT, "0.0.0.0", () => {
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();
  let localIP = "localhost";

  // Find the first non-internal IPv4 address
  Object.values(networkInterfaces).forEach((interfaces) => {
    interfaces.forEach((details) => {
      if (details.family === "IPv4" && !details.internal) {
        localIP = details.address;
      }
    });
  });

  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║                                                    ║
  ║   🥬 ExoticVeg360 API Server                       ║
  ║                                                    ║
  ║   Server running on port ${PORT}                      ║
  ║   Database: PostgreSQL                             ║
  ║   Environment: ${(process.env.NODE_ENV || "development").padEnd(15)}            ║
  ║                                                    ║
  ║   Local:   http://localhost:${PORT}                   ║
  ║   Network: http://${localIP}:${PORT}               ║
  ║                                                    ║
  ╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
