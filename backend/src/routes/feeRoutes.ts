import express, { Request, Response, NextFunction } from "express";
import mongoose, { Error as MongooseError } from "mongoose";
import Fee from "../models/fee";
import connectDB from "../dbconnect";
import jwt from "jsonwebtoken";

const router = express.Router();

// JWT authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// GET all fees for the authenticated lawyer
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const fees = await Fee.find({ lawyerId })
      .populate("caseId")
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (err: any) {
    console.error("Get fees error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch fees" });
  }
});

// GET a single fee by ID (ensure it belongs to the authenticated lawyer)
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const fee = await Fee.findOne({ _id: req.params.id, lawyerId }).populate(
      "caseId"
    );
    if (!fee) {
      return res.status(404).json({ error: "Fee not found or not authorized" });
    }
    res.json(fee);
  } catch (err: any) {
    console.error("Get fee error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch fee" });
  }
});

// POST a new fee (associate with authenticated lawyer)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { totalFee, paidAmount, caseId } = req.body;
    const pendingAmount = totalFee - paidAmount;
    const status =
      paidAmount >= totalFee
        ? "Completed"
        : paidAmount > 0
        ? "Partial"
        : "Pending";
    const newFee = new Fee({ ...req.body, lawyerId, pendingAmount, status });
    await newFee.save();
    const populatedFee = await Fee.findById(newFee._id).populate("caseId");
    res.status(201).json(populatedFee);
  } catch (err: any) {
    console.error("Post fee error:", err.message);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: "Validation error", details: err.errors });
    } else {
      res.status(500).json({ error: err.message || "Failed to create fee" });
    }
  }
});

// PUT (update fee by ID, ensure it belongs to the authenticated lawyer)
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { totalFee, paidAmount } = req.body;
    const pendingAmount = totalFee - paidAmount;
    const status =
      paidAmount >= totalFee
        ? "Completed"
        : paidAmount > 0
        ? "Partial"
        : "Pending";
    const updatedFee = await Fee.findOneAndUpdate(
      { _id: req.params.id, lawyerId },
      { ...req.body, pendingAmount, status },
      { new: true, runValidators: true }
    ).populate("caseId");
    if (!updatedFee) {
      return res.status(404).json({ error: "Fee not found or not authorized" });
    }
    res.json(updatedFee);
  } catch (err: any) {
    console.error("Update fee error:", err.message);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: "Validation error", details: err.errors });
    } else {
      res.status(500).json({ error: err.message || "Failed to update fee" });
    }
  }
});

// DELETE a fee (ensure it belongs to the authenticated lawyer)
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const fee = await Fee.findOneAndDelete({ _id: req.params.id, lawyerId });
      if (!fee) {
        return res
          .status(404)
          .json({ error: "Fee not found or not authorized" });
      }
      res.json({ message: "Fee deleted" });
    } catch (err: any) {
      console.error("Delete fee error:", err.message);
      res.status(500).json({ error: err.message || "Failed to delete fee" });
    }
  }
);

export default router;
