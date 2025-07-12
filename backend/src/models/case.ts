import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caseNumber: { type: String, required: true, unique: true },
  client: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
  },
  court: { type: String },
  fee: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    status: { type: String, enum: ['Completed', 'Partial', 'Pending'], default: 'Pending' },
  },
  status: { type: String, enum: ['In Progress', 'Pending', 'Closed'], default: 'Pending' },
  nextHearing: { type: String },
  createdAt: { type: Date, default: Date.now },
  documents: [{ type: String }], // Array of file paths
  notes: { type: String }, // Maps to "Proceeding" in frontend
});

export default mongoose.model('Case', caseSchema);