import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  lawyerId: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    barNumber?: string;
    experience?: string;
    specialization?: string;
    address?: string;
    bio?: string;
    profilePicture?: string;
  };
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  lawyerId: { type: String, required: true, unique: true, index: true },
  profile: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    barNumber: { type: String, trim: true },
    experience: { type: String, trim: true },
    specialization: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 200 },
    bio: { type: String, trim: true, maxlength: 500 },
    profilePicture: { type: String, trim: true },
  },
  updatedAt: { type: Date, default: Date.now },
});

const Settings = mongoose.model<ISettings>("Settings", settingsSchema);

console.log("✅ Settings model initialized");

export default Settings;
