import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Case from "../models/case";
import connectDB from "../dbconnect";

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

router.get("/summary", authenticateToken, async (req: Request, res: Response) => {
    try {
        await connectDB();
        const lawyerId = (req as any).user.id;

        const cases = await Case.find({ lawyerId });

        // Total numbers
        const totalCases = cases.length;
        let totalRevenue = 0;

        // Status breakdown
        let pendingCases = 0;
        let inProgressCases = 0;
        let closedCases = 0;
        let transferredCases = 0;

        // Additional analytics grouping
        const courtsMap: Record<string, number> = {};
        const caseTypeMap: Record<string, number> = {};

        cases.forEach(c => {
            // Calculate revenue
            totalRevenue += Number(c.fees || 0);

            // Status
            if (c.status === "Pending") pendingCases++;
            else if (c.status === "In Progress") inProgressCases++;
            else if (c.status === "Closed") closedCases++;
            else if (c.status === "Transferred") transferredCases++;

            // Court Distribution
            const courtStr = c.court ? c.court.trim() : "Unspecified";
            courtsMap[courtStr] = (courtsMap[courtStr] || 0) + 1;

            // Case Type (Win/Loss simulation - we categorize by Type mostly)
            const cType = c.caseType || c.title || "Other";
            caseTypeMap[cType] = (caseTypeMap[cType] || 0) + 1;
        });

        res.json({
            overview: {
                totalCases,
                totalRevenue,
                pending: pendingCases,
                inProgress: inProgressCases,
                closed: closedCases,
                transferred: transferredCases
            },
            byCourt: Object.entries(courtsMap).map(([name, value]) => ({ name, value })),
            byType: Object.entries(caseTypeMap).map(([name, value]) => ({ name, value }))
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to generate analytics" });
    }
});

// CSV Export Endpoint
router.get("/export-csv", authenticateToken, async (req: Request, res: Response) => {
    try {
        await connectDB();
        const lawyerId = (req as any).user.id;
        const cases = await Case.find({ lawyerId }).sort({ createdAt: -1 });

        if (!cases || cases.length === 0) {
            return res.status(404).json({ error: "No cases available to export." });
        }

        // CSV Headers
        const headers = [
            "Title",
            "Case Number",
            "Client Name",
            "Client Phone",
            "Opponent Name",
            "Court",
            "Status",
            "Next Hearing",
            "Total Fees",
            "Created At"
        ];

        let csvContent = headers.map(h => `"${h}"`).join(",") + "\r\n";

        cases.forEach(c => {
            const row = [
                c.title || "",
                c.caseNumber || "",
                c.client?.name || "",
                c.client?.phone || "",
                c.opponentName || "",
                c.court || "",
                c.status || "",
                c.nextHearing || "",
                c.fees || 0,
                c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""
            ];
            csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\r\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="cases_export.csv"');
        res.send(csvContent);
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to export data" });
    }
});

export default router;
