import mongoose, { Schema, Document } from "mongoose";

export interface ICommunicationLog extends Document {
    lawyerId: string;
    clientName: string;
    date: string;
    type: "Call" | "Meeting" | "Email" | "Other";
    summary: string;
    outcome?: string;
    createdAt: Date;
}

const logSchema: Schema = new Schema({
    lawyerId: { type: String, required: true, index: true },
    clientName: { type: String, required: true, index: true },
    date: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ["Call", "Meeting", "Email", "Other"],
        default: "Call"
    },
    summary: { type: String, required: true },
    outcome: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICommunicationLog>("CommunicationLog", logSchema);
