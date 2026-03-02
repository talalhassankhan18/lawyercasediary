// IMPORTANT: Load env vars FIRST before any other imports
// Routes read process.env at module load time (e.g. nodemailer in LawyerRoutes.ts)
import "dotenv/config";

import express from "express";
import cors from "cors";
import connectDB from "./dbconnect";
import caseRoutes from "./routes/caseRoutes";
import lawyerRoutes from "./routes/LawyerRoutes";
import SettingsRoutes from "./routes/settingsRoutes";
import FeeRoutes from "./routes/feeRoutes";
import CalendarRoutes from "./routes/calendarRoutes";
import ClientRoutes from "./routes/clientRoutes";
import AnalyticsRoutes from "./routes/analyticsRoutes";
import { startCronJobs } from "./cronService";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// API Routes
app.get("/", (req, res) => {
  res.send("Lawyer Case Diary Backend API is running...");
});

app.use("/api/cases", caseRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/settings", SettingsRoutes);
app.use("/api/fees", FeeRoutes);
app.use("/api/calendar", CalendarRoutes);
app.use("/api/clients", ClientRoutes);
app.use("/api/analytics", AnalyticsRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Initialize background tasks
startCronJobs();

