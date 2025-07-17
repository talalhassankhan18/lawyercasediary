import mongoose, { Schema, Document } from 'mongoose';

export interface ICase extends Document {
  lawyerId: string;
  title: string;
  caseNumber: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
  court?: string;
  fee: {
    total: number;
    paid: number;
    pending: number;
    status: 'Completed' | 'Partial' | 'Pending';
  };
  status: 'In Progress' | 'Pending' | 'Closed';
  nextHearing?: string;
  createdAt: Date;
  documents: string[];
  notes?: string;
}

const caseSchema = new Schema<ICase>({
  lawyerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  caseNumber: { type: String, required: true, unique: true, trim: true },
  client: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  court: { type: String, trim: true, maxlength: 100 },
  fee: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Completed', 'Partial', 'Pending'],
      default: 'Pending',
    },
  },
  status: {
    type: String,
    enum: ['In Progress', 'Pending', 'Closed'],
    default: 'Pending',
  },
  nextHearing: { type: String },
  createdAt: { type: Date, default: Date.now },
  documents: [{ type: String }],
  notes: { type: String, trim: true },
});

const Case = mongoose.model<ICase>('Case', caseSchema);

console.log('✅ Case model initialized');

export default Case;