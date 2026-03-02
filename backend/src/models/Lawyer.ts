import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface ILawyer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  firmName: string;
  phoneNumber: string;
  feeSecurityKey: string;
  profilePicture?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isVerified: boolean;
  subscription: {
    plan: string;
    status: "Active" | "Pending" | "Cancelled";
    trialEnd?: Date;
  };
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
  compareFeeSecurityKey(key: string): Promise<boolean>;
}

const lawyerSchema = new Schema<ILawyer>({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
  },
  password: { type: String, required: true },
  firmName: { type: String, required: true, trim: true, maxlength: 100 },
  phoneNumber: { type: String, required: true, trim: true, maxlength: 15 },
  feeSecurityKey: { type: String, required: true },
  profilePicture: { type: String, trim: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, default: "Professional" },
    status: {
      type: String,
      enum: ["Active", "Pending", "Cancelled"],
      default: "Pending",
    },
    trialEnd: { type: Date },
  },
  twoFactorEnabled: { type: Boolean, default: false },
  sessionTimeout: { type: Number, default: 30 },
  loginAlerts: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Hash password and feeSecurityKey before saving
lawyerSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified("feeSecurityKey")) {
      this.feeSecurityKey = await bcrypt.hash(this.feeSecurityKey, 10);
    }
    next();
  } catch (error: any) {
    console.error("❌ Error in Lawyer schema pre-save hook:", error.message);
    next(error);
  }
});

// Method to compare password
lawyerSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// Method to compare feeSecurityKey
lawyerSchema.methods.compareFeeSecurityKey = async function (key: string) {
  return await bcrypt.compare(key, this.feeSecurityKey);
};

const Lawyer = mongoose.model<ILawyer>("Lawyer", lawyerSchema);

console.log("✅ Lawyer model initialized");

export default Lawyer;
