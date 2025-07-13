import express from "express";
import mongoose, { Error as MongooseError } from "mongoose";
import Lawyer from "../models/Lawyer";
import validator from "validator";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter is ready");
  }
});

// Generate random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST signup
router.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      feeSecurityKey,
      firmName,
      phoneNumber,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !feeSecurityKey ||
      !firmName ||
      !phoneNumber
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const sanitizedData = {
      firstName: sanitizeHtml(firstName.trim()),
      lastName: sanitizeHtml(lastName.trim()),
      email: sanitizeHtml(email.trim().toLowerCase()),
      firmName: sanitizeHtml(firmName.trim()),
      phoneNumber: sanitizeHtml(phoneNumber.trim()),
    };

    if (!validator.isEmail(sanitizedData.email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long with uppercase, lowercase, number, and special character",
      });
    }

    if (!/^\d{4}$/.test(feeSecurityKey)) {
      return res
        .status(400)
        .json({ error: "Fee security key must be a 4-digit number" });
    }

    if (
      !validator.isMobilePhone(sanitizedData.phoneNumber, "any", {
        strictMode: true,
      })
    ) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const existingLawyer = await Lawyer.findOne({ email: sanitizedData.email });
    if (existingLawyer) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const lawyer = new Lawyer({
      ...sanitizedData,
      password,
      feeSecurityKey,
      verificationCode,
      verificationCodeExpires,
      subscription: {
        plan: "Professional",
        status: "Pending",
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await lawyer.save();

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: sanitizedData.email,
      subject: "Verify Your Lawyer's Case Diary Account",
      html: `
        <h2>Welcome to Lawyer's Case Diary!</h2>
        <p>Please use the following code to verify your email address:</p>
        <h3>${verificationCode}</h3>
        <p>This code will expire in 24 hours.</p>
      `,
    });

    res
      .status(201)
      .json({ message: "Account created. Please verify your email." });
  } catch (err) {
    console.error(err);
    if (err instanceof MongooseError.ValidationError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: err.errors });
    } else if (err instanceof MongooseError && (err as any).code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    } else {
      return res.status(500).json({ error: "Failed to create account" });
    }
  }
});

// POST verify email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res
        .status(400)
        .json({ error: "Email and verification code are required" });
    }

    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    const lawyer = await Lawyer.findOne({ email: sanitizedEmail });
    if (!lawyer) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (lawyer.isVerified) {
      return res.status(400).json({ error: "Account already verified" });
    }

    if (
      lawyer.verificationCode !== verificationCode ||
      (lawyer.verificationCodeExpires &&
        lawyer.verificationCodeExpires < new Date())
    ) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });
    }

    lawyer.isVerified = true;
    lawyer.verificationCode = undefined;
    lawyer.verificationCodeExpires = undefined;
    await lawyer.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// POST resend verification code
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    const lawyer = await Lawyer.findOne({ email: sanitizedEmail });
    if (!lawyer) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (lawyer.isVerified) {
      return res.status(400).json({ error: "Account already verified" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    lawyer.verificationCode = verificationCode;
    lawyer.verificationCodeExpires = verificationCodeExpires;
    await lawyer.save();

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: sanitizedEmail,
      subject: "Verify Your Lawyer's Case Diary Account",
      html: `
        <h2>Welcome to Lawyer's Case Diary!</h2>
        <p>Please use the following code to verify your email address:</p>
        <h3>${verificationCode}</h3>
        <p>This code will expire in 24 hours.</p>
      `,
    });

    res.json({ message: "Verification code resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
});

// POST complete subscription
router.post("/complete-subscription", async (req, res) => {
  try {
    const { email, paymentDetails } = req.body;

    if (!email || !paymentDetails) {
      return res
        .status(400)
        .json({ error: "Email and payment details are required" });
    }

    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    const lawyer = await Lawyer.findOne({ email: sanitizedEmail });
    if (!lawyer) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (!lawyer.isVerified) {
      return res.status(400).json({ error: "Please verify your email first" });
    }

    // Safely access subscription with default values
    lawyer.subscription = lawyer.subscription || {
      plan: "Professional",
      status: "Pending",
      trialEnd: new Date(),
    };
    lawyer.subscription.status = "Active";
    await lawyer.save();

    res.json({ message: "Subscription completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process subscription" });
  }
});

export default router;
