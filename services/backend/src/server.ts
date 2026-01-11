import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/auth.route.js";
import tenantRoutes from "./routes/auth/tenants.route.js";
import inHousePrintingRoutes from "./routes/inHousePrinting/in-house-printing.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import artWorkUpload from "./routes/inHousePrinting/artWorkUpload.route.js"

import vendorRoutes from "./routes/purchase/vendor.route.js"

import grnRoutes from "./routes/purchase/grn.route.js";

import { initDatabase } from "./db/init.js";
//import pool from './db/config.js';
import { Pool } from "pg";
import path from 'path';

const app = express();

const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes of application

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/inHouse-printing", inHousePrintingRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/artwork",artWorkUpload)
app.use("/api/purchase", grnRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads/artWorkImages')));
app.use('/api/vendor',vendorRoutes)

// DATABASE CONNECTION

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "your_database",
  password: process.env.DB_PASSWORD || "your_password",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
  console.log("✓ Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});

export default pool;

// SERVER CONNECTION
async function startServer() {
  try {
    // initialize database
    await initDatabase();

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (err: any) {
    console.error("✗ Failed to start server:", err.message);
    process.exit(-1);
  }
}

startServer();

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, closing database pool...');
//   await pool.end();
//   process.exit(0);
// });
