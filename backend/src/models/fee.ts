import mongoose, { Schema, Document } from "mongoose";

export interface IFeeInstallment {
  _id?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  method?: string;
  transactionId?: string;
  status: "Paid" | "Pending" | "Overdue";
  notes?: string;
}

export interface IFee extends Document {
  lawyerId: string;
  caseId: string | any;
  invoiceNumber: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Pending" | "Partial" | "Completed";
  installments: IFeeInstallment[];
  lastPaymentDate?: string;
  notes?: string;
  createdAt: Date;
}

const feeInstallmentSchema = new Schema<IFeeInstallment>(
  {
    amount: { type: Number, required: true },
    dueDate: { type: String, required: true }, // YYYY-MM-DD
    paidDate: { type: String }, // YYYY-MM-DD
    method: { type: String }, // Cash, Bank, Cheque, Online
    transactionId: { type: String },
    status: { type: String, enum: ["Paid", "Pending", "Overdue"], default: "Pending" },
    notes: { type: String },
  },
  { _id: true }
);

const feeSchema: Schema = new Schema({
  lawyerId: { type: String, required: true, index: true },
  caseId: { type: String, required: true, ref: "Case" },
  invoiceNumber: { type: String, required: true },
  totalFee: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  pendingAmount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ["Pending", "Partial", "Completed"],
    default: "Pending",
  },
  installments: [feeInstallmentSchema],
  lastPaymentDate: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for querying a lawyer's fees by case
feeSchema.index({ lawyerId: 1, caseId: 1 });
feeSchema.index({ lawyerId: 1, invoiceNumber: 1 }, { unique: true });

async function fixFeeIndexes() {
  try {
    const collection = mongoose.connection.collection("fees");
    const indexes = await collection.indexes().catch(() => []);

    // Drop the old transactionId index if it exists, since we removed it from the root schema
    const txIndex = indexes.find((idx: any) => idx.key.transactionId === 1);
    if (txIndex) {
      await collection.dropIndex("transactionId_1");
      console.log("Dropped legacy transactionId_1 index");
    }
  } catch (err) {
    console.error("Error managing fee indexes:", err);
  }
}

// Call this once on startup
mongoose.connection.once('open', fixFeeIndexes);

export default mongoose.model<IFee>("Fee", feeSchema);
