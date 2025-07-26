import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  Event,
  Holiday,
  AvailableSlot,
  Schedule,
  ISchedule,
} from "../models/calendar";
import Lawyer from "../models/Lawyer";
import Case from "../models/case";
import connectDB from "../dbconnect";
import {
  format,
  parseISO,
  isSunday,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addMinutes,
  isValid,
} from "date-fns";

const router = express.Router();

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    await connectDB();
    const lawyer = await Lawyer.findById(decoded.id);
    if (!lawyer || !lawyer.isVerified)
      return res.status(401).json({ error: "Invalid or unverified lawyer" });
    (req as any).user = { id: decoded.id };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const lawyer = await Lawyer.findById(lawyerId).select(
      "firstName lastName email firmName phoneNumber"
    );
    if (!lawyer) return res.status(404).json({ error: "Lawyer not found" });
    res.json({ id: lawyer._id, ...lawyer.toObject() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch lawyer" });
  }
});

router.get(
  "/events",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      console.log("Fetching events for lawyerId:", lawyerId);
      const events = await Event.find({ lawyerId }).sort({ date: 1, time: 1 });
      console.log("Events fetched from DB:", events);
      res.json(events);
    } catch (err: any) {
      console.error("Fetch events error:", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch events" });
    }
  }
);

router.post(
  "/events",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const { title, client, eventType, date, time, location, notes, status } =
        req.body;
      console.log("Creating event with data:", {
        lawyerId,
        title,
        client,
        eventType,
        date,
        time,
      });
      if (!title || !client || !eventType || !date || !time)
        return res.status(400).json({ error: "Missing fields" });
      if (!isValid(parseISO(date)))
        return res.status(400).json({ error: "Invalid date" });
      const newEvent = new Event({
        lawyerId,
        title,
        client,
        eventType,
        date,
        time,
        location,
        notes,
        status: status || "pending",
      });
      await newEvent.save();
      console.log("Event created:", newEvent);
      res.status(201).json(newEvent);
    } catch (err: any) {
      console.error("Create event error:", err.message);
      if (err instanceof mongoose.Error.ValidationError)
        return res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      res.status(500).json({ error: err.message || "Failed to create event" });
    }
  }
);

router.get(
  "/holidays",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const holidays = await Holiday.find();
      res.json(holidays);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch holidays" });
    }
  }
);

router.post(
  "/holidays",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const { date, name } = req.body;
      if (!date || !name)
        return res.status(400).json({ error: "Missing date or name" });
      if (!isValid(parseISO(date)))
        return res.status(400).json({ error: "Invalid date" });
      const holiday = new Holiday({ date, name });
      await holiday.save();
      res.status(201).json(holiday);
    } catch (err: any) {
      if ((err as any).code === 11000)
        return res.status(400).json({ error: "Holiday exists" });
      if (err instanceof mongoose.Error.ValidationError)
        return res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      res
        .status(500)
        .json({ error: err.message || "Failed to create holiday" });
    }
  }
);

router.get("/slots", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const slots = await AvailableSlot.find({ lawyerId }).sort({ date: 1 });
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch slots" });
  }
});

router.get(
  "/weekly-schedule",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const schedule =
        (await Schedule.findOne({ lawyerId })) ||
        new Schedule({
          lawyerId,
          monday: { available: false, hours: [] },
          tuesday: { available: false, hours: [] },
          wednesday: { available: false, hours: [] },
          thursday: { available: false, hours: [] },
          friday: { available: false, hours: [] },
          saturday: { available: false, hours: [] },
        });
      res.json(schedule);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch schedule" });
    }
  }
);

router.post(
  "/weekly-schedule",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const { monday, tuesday, wednesday, thursday, friday, saturday } =
        req.body;
      const scheduleData = {
        lawyerId,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
      };
      const existingSchedule = await Schedule.findOne({ lawyerId });
      if (existingSchedule) {
        await Schedule.updateOne(
          { lawyerId },
          { $set: scheduleData },
          { upsert: true }
        );
      } else {
        const newSchedule = new Schedule(scheduleData);
        await newSchedule.save();
      }
      await generateAvailableSlotsForWeek(lawyerId);
      const updatedSchedule = await Schedule.findOne({ lawyerId });
      res.status(201).json(updatedSchedule);
    } catch (err: any) {
      if (err instanceof mongoose.Error.ValidationError)
        return res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      res.status(500).json({ error: err.message || "Failed to set schedule" });
    }
  }
);

router.get(
  "/upcoming-hearings",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const today = startOfDay(new Date());
      const cases = await Case.find({
        lawyerId,
        nextHearing: { $gte: today.toISOString().split("T")[0] },
      }).sort({ nextHearing: 1 });
      const hearings = cases.map((case_) => ({
        id: case_._id,
        lawyerId,
        title: case_.title,
        client: case_.client.name,
        eventType: "hearing",
        date: case_.nextHearing,
        time: case_.nextHearing
          ? format(parseISO(case_.nextHearing), "HH:mm")
          : "TBD",
        location: case_.court || "N/A",
        status:
          case_.status === "Pending"
            ? "pending"
            : case_.status === "In Progress"
            ? "confirmed"
            : "closed",
        createdAt: case_.createdAt,
        caseDetails: {
          caseNumber: case_.caseNumber,
          opponentName: case_.opponentName || "N/A",
        },
      }));
      res.json(hearings);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch hearings" });
    }
  }
);

async function generateAvailableSlotsForWeek(lawyerId: string) {
  try {
    await connectDB();
    const schedule = await Schedule.findOne({ lawyerId });
    if (!schedule) return;
    const holidays = await Holiday.find();
    const events = await Event.find({ lawyerId, eventType: "hearing" });
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, 7);
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const dateString = format(date, "yyyy-MM-dd");
      const isFriday = date.getDay() === 5;
      const isSundayOrHoliday =
        isSunday(date) || holidays.some((h) => h.date === dateString);
      if (isSundayOrHoliday) continue;
      const dayOfWeek = format(date, "EEEE").toLowerCase() as keyof ISchedule;
      const daySchedule = schedule[dayOfWeek];
      if (!daySchedule.available) continue;
      const startHour = 9;
      const endHour = 17;
      const breakStart = isFriday
        ? parseISO(`${dateString}T12:30:00`)
        : parseISO(`${dateString}T13:00:00`);
      const breakEnd = isFriday
        ? parseISO(`${dateString}T14:30:00`)
        : parseISO(`${dateString}T14:00:00`);
      const slots: string[] = [];
      let currentTime = new Date(date.setHours(startHour, 0, 0));
      const endTime = new Date(date.setHours(endHour, 0, 0));
      while (currentTime < endTime) {
        const slotTime = format(currentTime, "HH:mm");
        if (
          !isWithinInterval(currentTime, {
            start: breakStart,
            end: breakEnd,
          }) &&
          daySchedule.hours.includes(slotTime) &&
          !events.some((e) => e.date === dateString && e.time === slotTime)
        ) {
          slots.push(slotTime);
        }
        currentTime = addMinutes(currentTime, 60);
      }
      if (slots.length > 0) {
        await AvailableSlot.findOneAndUpdate(
          { lawyerId, date: dateString },
          { lawyerId, date: dateString, slots },
          { upsert: true }
        );
      }
    }
    await AvailableSlot.deleteMany({
      lawyerId,
      date: { $lt: format(startOfDay(new Date()), "yyyy-MM-dd") },
    });
  } catch (err: any) {
    console.error("Generate slots error:", err.message);
  }
}

export default router;
