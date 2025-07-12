import mongoose, { Document, Schema } from 'mongoose';

// Interface for TypeScript type-checking
export interface ICase extends Document {
  clientName: string;
  caseTitle: string;
  court: string;
  date: string;
  status: string;
}

// Mongoose schema
const caseSchema: Schema = new Schema(
  {
    clientName: { type: String, required: true },
    caseTitle: { type: String, required: true },
    court: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

// Export the model
const Case = mongoose.model<ICase>('Case', caseSchema);
export default Case;
