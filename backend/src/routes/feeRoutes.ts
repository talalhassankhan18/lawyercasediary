import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Fee, { IFeeInstallment } from "../models/fee";
import Case from "../models/case";
import connectDB from "../dbconnect";
import jwt from "jsonwebtoken";
import { format } from "date-fns";

const router = express.Router();

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// GET Dashboard Summary (New feature)
router.get("/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;

    // Aggregate fee counts
    const stats = await Fee.aggregate([
      { $match: { lawyerId } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: "$totalFee" },
          totalReceived: { $sum: "$paidAmount" },
          totalPending: { $sum: "$pendingAmount" },
          completedCases: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          partialCases: {
            $sum: { $cond: [{ $eq: ["$status", "Partial"] }, 1, 0] }
          },
          pendingCases: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          }
        }
      }
    ]);

    // Upcoming overdue/pending installments
    const today = new Date().toISOString().split("T")[0];
    const upcomingInstallments = await Fee.aggregate([
      { $match: { lawyerId, status: { $ne: "Completed" } } },
      { $unwind: "$installments" },
      { $match: { "installments.status": { $ne: "Paid" } } },
      { $sort: { "installments.dueDate": 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "cases",
          let: { caseIdObj: { $toObjectId: "$caseId" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$caseIdObj"] } } },
            { $project: { title: 1, caseNumber: 1, "client.name": 1 } }
          ],
          as: "caseDetails"
        }
      },
      { $unwind: "$caseDetails" }
    ]);

    res.json({
      stats: stats[0] || { totalBilled: 0, totalReceived: 0, totalPending: 0, completedCases: 0, partialCases: 0, pendingCases: 0 },
      upcomingInstallments
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch fee summary" });
  }
});

// GET all fees
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const fees = await Fee.find({ lawyerId })
      .populate("caseId", "title caseNumber client opponentName status nextHearing")
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch fees" });
  }
});

// GET fee by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const fee = await Fee.findOne({ _id: req.params.id, lawyerId })
      .populate("caseId", "title caseNumber client opponentName court");
    if (!fee) return res.status(404).json({ error: "Fee record not found" });
    res.json(fee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Invoice Number
const generateInvoiceNumber = async (lawyerId: string) => {
  const count = await Fee.countDocuments({ lawyerId });
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// POST setup a new fee for a case
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { caseId, totalFee, installments = [], notes } = req.body;

    if (!caseId || totalFee == null) {
      return res.status(400).json({ error: "Case ID and total fee are required" });
    }

    const caseExists = await Case.findOne({ _id: caseId, lawyerId });
    if (!caseExists) return res.status(404).json({ error: "Case not found" });

    // Validate that total fee matches installments if any
    const installmentsTotal = installments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    if (installments.length > 0 && Math.abs(installmentsTotal - totalFee) > 1) {
      return res.status(400).json({ error: "Installment amounts must equal the total fee" });
    }

    // Auto calculate initial payments if any installments are already 'Paid'
    let paidAmount = 0;
    const finalInstallments = installments.map((inst: any) => {
      if (inst.status === "Paid") {
        paidAmount += Number(inst.amount);
        inst.paidDate = inst.paidDate || format(new Date(), "yyyy-MM-dd");
      }
      return inst;
    });

    const pendingAmount = totalFee - paidAmount;
    const status = paidAmount >= totalFee ? "Completed" : paidAmount > 0 ? "Partial" : "Pending";
    const invoiceNumber = await generateInvoiceNumber(lawyerId);

    const newFee = new Fee({
      lawyerId,
      caseId,
      invoiceNumber,
      totalFee,
      paidAmount,
      pendingAmount,
      status,
      installments: finalInstallments,
      notes,
    });

    await newFee.save();

    // Also update the case total fees to match the fee tracking
    caseExists.fees = totalFee;
    await caseExists.save();

    const populatedFee = await Fee.findById(newFee._id).populate("caseId", "title caseNumber client");
    res.status(201).json(populatedFee);
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: "Fee record/invoice already exists" });
    res.status(500).json({ error: err.message || "Failed to create fee" });
  }
});

// POST mark an installment as paid
router.post("/:id/installments/:instId/pay", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { method, transactionId, notes } = req.body;

    const fee = await Fee.findOne({ _id: req.params.id, lawyerId });
    if (!fee) return res.status(404).json({ error: "Fee not found" });

    const installment: any = fee.installments.find((i: any) => i._id.toString() === req.params.instId);
    if (!installment) return res.status(404).json({ error: "Installment not found" });

    if (installment.status === "Paid") {
      return res.status(400).json({ error: "Installment is already paid" });
    }

    const today = format(new Date(), "yyyy-MM-dd");
    installment.status = "Paid";
    installment.paidDate = today;
    installment.method = method || "Cash";
    if (transactionId) installment.transactionId = transactionId;
    if (notes) installment.notes = notes;

    // Recalculate totals
    const totalPaid = fee.installments
      .filter(i => i.status === "Paid")
      .reduce((acc: number, curr: IFeeInstallment) => acc + curr.amount, 0);

    fee.paidAmount = totalPaid;
    fee.pendingAmount = fee.totalFee - totalPaid;
    fee.status = fee.paidAmount >= fee.totalFee ? "Completed" : "Partial";
    fee.lastPaymentDate = today;

    await fee.save();
    res.json({ message: "Installment marked as paid", fee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark entire fee as fully paid
router.post("/:id/receive-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { method, notes } = req.body;

    const fee = await Fee.findOne({ _id: req.params.id, lawyerId });
    if (!fee) return res.status(404).json({ error: "Fee not found" });

    const today = format(new Date(), "yyyy-MM-dd");

    // If no installments, just mark whole thing
    if (!fee.installments || fee.installments.length === 0) {
      fee.paidAmount = fee.totalFee;
      fee.pendingAmount = 0;
      fee.status = "Completed";
      fee.lastPaymentDate = today;
    } else {
      // Mark all installments
      fee.installments = fee.installments.map((inst: any) => {
        if (inst.status !== "Paid") {
          inst.status = "Paid";
          inst.paidDate = today;
          inst.method = method || "Cash";
        }
        return inst;
      });
      fee.paidAmount = fee.totalFee;
      fee.pendingAmount = 0;
      fee.status = "Completed";
      fee.lastPaymentDate = today;
    }

    if (notes) fee.notes = (fee.notes ? fee.notes + " | " : "") + notes;

    await fee.save();
    res.json({ message: "All installments marked as paid", fee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update full fee struct
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { totalFee, installments = [], notes } = req.body;

    const fee = await Fee.findOne({ _id: req.params.id, lawyerId });
    if (!fee) return res.status(404).json({ error: "Fee not found" });

    const installmentsTotal = installments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    if (installments.length > 0 && Math.abs(installmentsTotal - totalFee) > 1) {
      return res.status(400).json({ error: "Installment amounts must equal the total fee" });
    }

    let paidAmount = 0;
    const finalInstallments = installments.map((inst: any) => {
      if (inst.status === "Paid") paidAmount += Number(inst.amount);
      return inst;
    });

    fee.totalFee = totalFee;
    fee.installments = finalInstallments;
    fee.paidAmount = paidAmount;
    fee.pendingAmount = totalFee - paidAmount;
    fee.status = paidAmount >= totalFee ? "Completed" : paidAmount > 0 ? "Partial" : "Pending";
    fee.notes = notes;

    await fee.save();

    // Attempt update on case too
    await Case.updateOne({ _id: fee.caseId, lawyerId }, { fees: totalFee });

    const populated = await Fee.findById(fee._id).populate("caseId", "title caseNumber client");
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE fee
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const fee = await Fee.findOneAndDelete({ _id: req.params.id, lawyerId });
    if (!fee) return res.status(404).json({ error: "Fee not found" });

    // Unlink from case
    await Case.updateOne({ _id: fee.caseId, lawyerId }, { fees: 0 });

    res.json({ message: "Fee deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;