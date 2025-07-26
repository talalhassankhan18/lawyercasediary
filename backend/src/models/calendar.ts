import mongoose, { Schema, Document } from "mongoose";
import { isValid, parseISO } from "date-fns";

export interface IEvent extends Document {
  lawyerId: string;
  title: string;
  client: string;
  eventType: "hearing" | "consultation" | "meeting" | "deadline";
  date: string;
  time: string;
  location?: string;
  notes?: string;
  status: "pending" | "confirmed" | "closed";
  caseDetails?: {
    caseNumber: string;
    opponentName: string;
  };
  createdAt: Date;
}

export interface IHoliday extends Document {
  date: string;
  name: string;
  createdAt: Date;
}

export interface IAvailableSlot extends Document {
  lawyerId: string;
  date: string;
  slots: string[];
  createdAt: Date;
}

export interface ISchedule extends Document {
  lawyerId: string;
  monday: { available: boolean; hours: string[] };
  tuesday: { available: boolean; hours: string[] };
  wednesday: { available: boolean; hours: string[] };
  thursday: { available: boolean; hours: string[] };
  friday: { available: boolean; hours: string[] };
  saturday: { available: boolean; hours: string[] };
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  lawyerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  client: { type: String, required: true, trim: true, maxlength: 100 },
  eventType: {
    type: String,
    enum: ["hearing", "consultation", "meeting", "deadline"],
    required: true,
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => isValid(parseISO(v)),
      message: "Invalid date format",
    },
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: "Time must be in HH:MM format",
    },
  },
  location: { type: String, trim: true, maxlength: 100 },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "closed"],
    default: "pending",
  },
  caseDetails: {
    caseNumber: { type: String, default: "N/A" },
    opponentName: { type: String, default: "N/A" },
  },
  createdAt: { type: Date, default: Date.now },
});

const holidaySchema = new Schema<IHoliday>({
  date: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => isValid(parseISO(v)),
      message: "Invalid date format",
    },
    unique: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now },
});

const slotSchema = new Schema<IAvailableSlot>({
  lawyerId: { type: String, required: true, index: true },
  date: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => isValid(parseISO(v)),
      message: "Invalid date format",
    },
  },
  slots: [{ type: String, validate: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ }],
  createdAt: { type: Date, default: Date.now },
});

const scheduleSchema = new Schema<ISchedule>({
  lawyerId: { type: String, required: true, index: true, unique: true },
  monday: { available: Boolean, hours: [String] },
  tuesday: { available: Boolean, hours: [String] },
  wednesday: { available: Boolean, hours: [String] },
  thursday: { available: Boolean, hours: [String] },
  friday: { available: Boolean, hours: [String] },
  saturday: { available: Boolean, hours: [String] },
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.model<IEvent>("Event", eventSchema);
export const Holiday = mongoose.model<IHoliday>("Holiday", holidaySchema);
export const AvailableSlot = mongoose.model<IAvailableSlot>(
  "AvailableSlot",
  slotSchema
);
export const Schedule = mongoose.model<ISchedule>("Schedule", scheduleSchema);

console.log("✅ Calendar models initialized");
