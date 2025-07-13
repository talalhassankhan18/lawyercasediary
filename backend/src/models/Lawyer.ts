import mongoose, { CallbackError } from "mongoose";
import bcrypt from "bcrypt";

const lawyerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      "Please enter a valid email address",
    ],
  },
  password: { type: String, required: true, minlength: 8 },
  feeSecurityKey: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4,
  },
  firmName: { type: String, required: true, trim: true },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
  },
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
  createdAt: { type: Date, default: Date.now },
});

// Create indexes for better query performance
lawyerSchema.index({ email: 1 });

// Hash password and feeSecurityKey before saving
lawyerSchema.pre("save", async function (next: (err?: CallbackError) => void) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified("feeSecurityKey")) {
      this.feeSecurityKey = await bcrypt.hash(this.feeSecurityKey, 10);
    }
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Method to compare passwords
lawyerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing password");
  }
};

// Method to compare fee security key
lawyerSchema.methods.compareFeeSecurityKey = async function (
  candidateKey: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidateKey, this.feeSecurityKey);
  } catch (error) {
    throw new Error("Error comparing fee security key");
  }
};

export default mongoose.model("Lawyer", lawyerSchema);
