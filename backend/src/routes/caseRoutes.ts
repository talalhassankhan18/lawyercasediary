import express, { Request, Response, NextFunction } from "express";
import mongoose, { Error as MongooseError } from "mongoose";
import Case from "../models/case";
import { Event, Holiday } from "../models/calendar";
import connectDB from "../dbconnect";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { isSunday, parseISO, isSameDay, isValid, addMonths, format } from "date-fns";
import fs from "fs/promises";
import Lawyer from "../models/Lawyer";

const router = express.Router();

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ─── File Upload ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    if (filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── Hearing Date Validation ─────────────────────────────────────────────────
const validateHearingDate = async (date: string | undefined, lawyerId: string): Promise<string | null> => {
  if (!date || !isValid(parseISO(date))) return null;
  const selectedDate = parseISO(date);
  if (isSunday(selectedDate)) return "Cannot schedule hearing on a Sunday";
  const holidays = await Holiday.find();
  if (holidays.some((h) => h.date && isSameDay(parseISO(h.date), selectedDate)))
    return "Cannot schedule hearing on a holiday";
  return null;
};

// ─── GET /api/cases — Advanced Filtering ────────────────────────────────────
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const {
      page = 1, limit = 20, date, month, all,
      status, court, clientName, opponentName, caseType,
      dateFrom, dateTo, sortBy = "createdAt", sortOrder = "desc",
      search,
    } = req.query;

    let query: any = { lawyerId };

    // Date filters
    if (date) {
      query.nextHearing = date as string;
    } else if (month) {
      const [year, monthNum] = (month as string).split("-");
      const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const end = addMonths(start, 1);
      query.nextHearing = { $gte: format(start, "yyyy-MM-dd"), $lt: format(end, "yyyy-MM-dd") };
    } else if (dateFrom || dateTo) {
      query.nextHearing = {};
      if (dateFrom) query.nextHearing.$gte = dateFrom as string;
      if (dateTo) query.nextHearing.$lte = dateTo as string;
    } else if (all !== "true") {
      // Default: fetch all for this lawyer only (no date filter)
    }

    // Field filters
    if (status && status !== "all") query.status = status;
    if (court) query.court = { $regex: court as string, $options: "i" };
    if (caseType && caseType !== "all") query.caseType = caseType;
    if (opponentName) query.opponentName = { $regex: opponentName as string, $options: "i" };
    if (clientName) query["client.name"] = { $regex: clientName as string, $options: "i" };

    // Full-text search across multiple fields
    if (search) {
      const searchRegex = { $regex: search as string, $options: "i" };
      query.$or = [
        { title: searchRegex },
        { caseNumber: searchRegex },
        { "client.name": searchRegex },
        { opponentName: searchRegex },
        { court: searchRegex },
      ];
    }

    const sortDir = sortOrder === "asc" ? 1 : -1;
    const sortField = sortBy as string;
    const sortObj: any = {};
    if (sortField === "nextHearing") {
      sortObj.nextHearing = sortDir;
    } else if (sortField === "caseNumber") {
      sortObj.caseNumber = sortDir;
    } else if (sortField === "client") {
      sortObj["client.name"] = sortDir;
    } else {
      sortObj.createdAt = sortDir;
    }

    const cases = await Case.find(query)
      .sort(sortObj)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Case.countDocuments(query);
    res.json({ cases, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err: any) {
    console.error("Get cases error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch cases" });
  }
});

// ─── GET /api/cases/today — Today's Diary ───────────────────────────────────
router.get("/today", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    // Allow client to pass their local 'today' date to handle timezone differences
    const today = (req.query.date as string) || format(new Date(), "yyyy-MM-dd");

    const cases = await Case.find({
      lawyerId,
      nextHearing: today,
      status: { $nin: ["Closed", "Transferred"] } // Usually Roznama is for active cases
    }).sort({ "client.name": 1 });

    const lawyer = await Lawyer.findById(lawyerId).select("firstName lastName firmName");
    res.json({ cases, today, lawyer, count: cases.length });
  } catch (err: any) {
    console.error("Get today's cases error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch today's cases" });
  }
});

// ─── GET /api/cases/all — All cases (for fee mgmt etc.) ─────────────────────
router.get("/all", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { limit = 200 } = req.query;
    const cases = await Case.find({ lawyerId }).sort({ createdAt: -1 }).limit(parseInt(limit as string));
    const total = await Case.countDocuments({ lawyerId });
    res.json({ cases, total });
  } catch (err: any) {
    console.error("Get all cases error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch all cases" });
  }
});

// ─── GET /api/cases/:id — Single case ───────────────────────────────────────
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });
    res.json(case_);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch case" });
  }
});

// ─── POST /api/cases — Create case ──────────────────────────────────────────
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { nextHearing } = req.body;
    const dateError = await validateHearingDate(nextHearing, lawyerId);
    if (dateError) return res.status(400).json({ error: dateError });
    const newCase = new Case({ ...req.body, lawyerId, proceedingsHistory: [] });
    await newCase.save();
    console.log("Case created:", newCase._id, newCase.title);
    res.status(201).json(newCase);
  } catch (err: any) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: "Validation error", details: err.errors });
    } else if ((err as any).code === 11000) {
      return res.status(400).json({ error: "Case number already exists" });
    }
    res.status(500).json({ error: err.message || "Failed to create case" });
  }
});

// ─── PUT /api/cases/:id — Update case ───────────────────────────────────────
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { nextHearing } = req.body;
    const dateError = await validateHearingDate(nextHearing, lawyerId);
    if (dateError) return res.status(400).json({ error: dateError });

    const existingCase = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!existingCase) return res.status(404).json({ error: "Case not found or not authorized" });

    // Auto-archive old hearing date if changed
    if (nextHearing && existingCase.nextHearing && nextHearing !== existingCase.nextHearing) {
      req.body.previousHearings = [...(existingCase.previousHearings || []), existingCase.nextHearing];
    }

    const updatedCase = await Case.findOneAndUpdate(
      { _id: req.params.id, lawyerId },
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedCase);
  } catch (err: any) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: "Validation error", details: err.errors });
    }
    res.status(500).json({ error: err.message || "Failed to update case" });
  }
});

// ─── PUT /api/cases/:id/adjourn — Adjourn (reschedule) hearing ──────────────
router.put("/:id/adjourn", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { newDate, reason } = req.body;

    if (!newDate) return res.status(400).json({ error: "New hearing date is required" });
    if (!isValid(parseISO(newDate))) return res.status(400).json({ error: "Invalid date format" });

    const dateError = await validateHearingDate(newDate, lawyerId);
    if (dateError) return res.status(400).json({ error: dateError });

    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });

    const oldDate = case_.nextHearing;

    // Archive old date
    if (oldDate) {
      case_.previousHearings = [...(case_.previousHearings || []), oldDate];
    }

    // Add a proceeding entry for the adjournment
    case_.proceedingsHistory = case_.proceedingsHistory || [];
    case_.proceedingsHistory.push({
      date: oldDate || format(new Date(), "yyyy-MM-dd"),
      notes: `Adjourned to ${newDate}${reason ? ` — Reason: ${reason}` : ""}`,
      addedAt: new Date(),
    });

    case_.nextHearing = newDate;
    await case_.save();

    console.log(`Case ${case_._id} adjourned from ${oldDate} to ${newDate}`);
    res.json({ message: "Hearing adjourned successfully", case: case_ });
  } catch (err: any) {
    console.error("Adjourn error:", err.message);
    res.status(500).json({ error: err.message || "Failed to adjourn hearing" });
  }
});

// ─── POST /api/cases/:id/proceedings — Add proceeding entry ─────────────────
router.post("/:id/proceedings", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const { date, notes } = req.body;

    if (!notes || notes.trim() === "") return res.status(400).json({ error: "Proceedings notes are required" });

    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });

    const entry = {
      date: date || format(new Date(), "yyyy-MM-dd"),
      notes: notes.trim(),
      addedAt: new Date(),
    };

    case_.proceedingsHistory = case_.proceedingsHistory || [];
    case_.proceedingsHistory.unshift(entry); // newest first
    await case_.save();

    res.status(201).json({ message: "Proceedings added", entry, case: case_ });
  } catch (err: any) {
    console.error("Add proceedings error:", err.message);
    res.status(500).json({ error: err.message || "Failed to add proceedings" });
  }
});

// ─── DELETE /api/cases/:caseId/proceedings/:procId — Delete a proceeding ────
router.delete("/:id/proceedings/:procId", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });

    case_.proceedingsHistory = (case_.proceedingsHistory || []).filter(
      (p: any) => p._id.toString() !== req.params.procId
    );
    await case_.save();
    res.json({ message: "Proceeding deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete proceeding" });
  }
});

// ─── DELETE /api/cases/:id — Delete case ────────────────────────────────────
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const case_ = await Case.findOneAndDelete({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });
    res.json({ message: "Case deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete case" });
  }
});

// ─── POST /api/cases/:id/documents — Upload documents ───────────────────────
router.post("/:id/documents", authenticateToken, upload.array("documents", 5), async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
    const filePaths = files.map((file) => file.path);
    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) return res.status(404).json({ error: "Case not found or not authorized" });
    case_.documents = [...(case_.documents || []), ...filePaths];
    await case_.save();
    res.status(201).json({ message: "Documents uploaded", filePaths });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to upload files" });
  }
});

// ─── GET /api/cases/today/print — Print today's diary ───────────────────────
router.get("/today/print", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const today = format(new Date(), "yyyy-MM-dd");
    const cases = await Case.find({ lawyerId, nextHearing: today }).sort({ "client.name": 1 });
    const lawyer = await Lawyer.findById(lawyerId).select("firstName lastName firmName");
    const lawyerName = lawyer ? `Advocate ${lawyer.firstName} ${lawyer.lastName}` : "Lawyer";
    const firmName = (lawyer?.firmName || "Law Firm").toUpperCase();

    // Helper to center text in 50 chars
    const center = (text: string) => {
      const padding = Math.max(0, Math.floor((50 - text.length) / 2));
      return " ".repeat(padding) + text;
    };

    let content = `${center(firmName)}\n`;
    content += `${center(lawyerName)}\n`;
    content += `${center(`Diary for ${today}`)}\n`;
    content += `${center(`Total Cases: ${cases.length}`)}\n`;
    content += `${"=".repeat(50)}\n\n`;

    cases.forEach((c, i) => {
      content += `${i + 1}. ${c.title}\n`;
      content += `   Case #: ${c.caseNumber}  |  Court: ${c.court || "N/A"}  |  Type: ${c.caseType || "N/A"}\n`;
      content += `   Client: ${c.client.name}  |  Opponent: ${c.opponentName || "N/A"}\n`;
      content += `   Status: ${c.status}\n`;
      if (c.proceedings) content += `   Proceedings: ${c.proceedings}\n`;
      content += `   ${"-".repeat(46)}\n\n`;
    });

    const filePath = `diary_${today}.txt`;
    await fs.writeFile(filePath, content);
    res.download(filePath, `diary_${today}.txt`, async () => { await fs.unlink(filePath).catch(() => { }); });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate diary" });
  }
});

export default router;