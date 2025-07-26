import mongoose, { Schema, Document } from "mongoose";
import { ICase } from "./case";

export interface IFee extends Document {
  lawyerId: string;
  caseId: ICase | string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Pending" | "Partial" | "Completed";
  paymentMethod?: string;
  transactionId?: string;
  lastPayment?: string;
  createdAt: Date;
}

const feeSchema = new Schema<IFee>({
  lawyerId: { type: String, required: true, index: true },
  caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true },
  totalFee: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0, default: 0 },
  pendingAmount: { type: Number, required: true, min: 0, default: 0 },
  status: {
    type: String,
    enum: ["Pending", "Partial", "Completed"],
    default: "Pending",
  },
  paymentMethod: { type: String, trim: true },
  transactionId: { type: String, trim: true },
  lastPayment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Fee = mongoose.model<IFee>("Fee", feeSchema);

console.log("✅ Fee model initialized");

export default Fee;
