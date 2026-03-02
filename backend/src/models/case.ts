// Updated Case model with proceedings history, adjournments, and case type
import mongoose, { Schema, Document } from "mongoose";

export interface IProceeding {
  date: string;
  notes: string;
  addedAt: Date;
}

export interface IAdjournment {
  fromDate: string;
  toDate: string;
  reason?: string;
  adjournedAt: Date;
}

export interface ICase extends Document {
  lawyerId: string;
  title: string;
  caseNumber: string;
  caseType?: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
  court?: string;
  status: "In Progress" | "Pending" | "Closed" | "Transferred";
  statusNotes?: string;
  nextHearing?: string;
  previousHearings: string[];
  proceedingsHistory: IProceeding[];
  proceedings?: string;
  fees?: number;
  createdAt: Date;
  documents: string[];
  notes?: string;
  opponentName?: string;
}

const proceedingSchema = new Schema<IProceeding>(
  {
    date: { type: String, required: true },
    notes: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const caseSchema = new Schema<ICase>({
  lawyerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  caseNumber: { type: String, required: true, unique: true, trim: true },
  caseType: {
    type: String,
    enum: ["Civil", "Criminal", "Family", "Labour", "Commercial", "Constitutional", "Tax", "Other"],
    default: "Other",
  },
  client: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  court: { type: String, trim: true, maxlength: 100 },
  status: {
    type: String,
    enum: ["In Progress", "Pending", "Closed", "Transferred"],
    default: "Pending",
  },
  statusNotes: { type: String, trim: true },
  nextHearing: { type: String, index: true },
  previousHearings: [{ type: String }],
  proceedingsHistory: [proceedingSchema],
  proceedings: { type: String, trim: true },
  fees: { type: Number, min: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
  documents: [{ type: String }],
  notes: { type: String, trim: true },
  opponentName: { type: String, trim: true, maxlength: 100 },
});

// Compound index for today's diary query performance
caseSchema.index({ lawyerId: 1, nextHearing: 1 });
caseSchema.index({ lawyerId: 1, status: 1 });

const Case = mongoose.model<ICase>("Case", caseSchema);

console.log("✅ Case model initialized");

export default Case;