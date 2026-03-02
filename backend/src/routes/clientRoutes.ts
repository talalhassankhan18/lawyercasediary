import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import CommunicationLog from "../models/CommunicationLog";

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

// GET communication logs for a specific client
router.get("/:clientName/logs", authenticateToken, async (req: Request, res: Response) => {
    try {
        const lawyerId = (req as any).user.id;
        const clientName = req.params.clientName;
        const logs = await CommunicationLog.find({ lawyerId, clientName }).sort({ date: -1, createdAt: -1 });
        res.json(logs);
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to fetch client logs" });
    }
});

// POST a new communication log
router.post("/:clientName/logs", authenticateToken, async (req: Request, res: Response) => {
    try {
        const lawyerId = (req as any).user.id;
        const clientName = req.params.clientName;
        const { date, type, summary, outcome } = req.body;

        const newLog = new CommunicationLog({
            lawyerId,
            clientName,
            date,
            type,
            summary,
            outcome
        });

        await newLog.save();
        res.status(201).json(newLog);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Failed to add communication log" });
    }
});

// DELETE a communication log
router.delete("/:clientName/logs/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
        const lawyerId = (req as any).user.id;
        const result = await CommunicationLog.findOneAndDelete({ _id: req.params.id, lawyerId });
        if (!result) return res.status(404).json({ error: "Log not found" });
        res.json({ message: "Log deleted" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
