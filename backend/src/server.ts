// server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./dbconnect";
import caseRoutes from "./routes/caseRoutes";
import lawyerRoutes from "./routes/LawyerRoutes"; // Add this

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to Lawyer Case Diary Backend API");
});

app.use("/api/cases", caseRoutes);
app.use("/lawyers", lawyerRoutes); // Add this

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});