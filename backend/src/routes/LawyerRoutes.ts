import express, { Request, Response, NextFunction } from "express";
import mongoose, { Error as MongooseError } from "mongoose";
import jwt from "jsonwebtoken";
import Lawyer, { ILawyer } from "../models/Lawyer";
import validator from "validator";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: "lawyer_profiles",
      allowed_formats: ["jpg", "png"],
      transformation: [{ width: 200, height: 200, crop: "limit" }],
    };
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

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
    console.error("Email transporter initialization error:", error);
  } else {
    console.log("Email transporter is ready");
  }
});

// Rate limiter for sensitive endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per window
  message: { error: "Too many login attempts. Please try again later." },
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit to 3 signup attempts
  message: { error: "Too many signup attempts. Please try again later." },
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit to 3 resend attempts
  message: { error: "Too many resend attempts. Please try again later." },
});

// JWT authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Generate random 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST profile picture upload
router.post(
  "/profile-picture",
  upload.single("profilePicture"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No image file provided" });
      }

      const profilePicture = req.file.path; // Cloudinary URL
      console.log("Profile picture uploaded to Cloudinary:", profilePicture);

      res.json({
        message: "Profile picture uploaded successfully",
        profilePicture,
      });
    } catch (err: any) {
      console.error("Profile picture upload error:", err.message);
      res
        .status(500)
        .json({ error: err.message || "Failed to upload profile picture" });
    }
  }
);

// POST signup
router.post("/signup", signupLimiter, async (req: Request, res: Response) => {
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
      profilePicture,
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
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const sanitizedData = {
      firstName: sanitizeHtml(firstName.trim()),
      lastName: sanitizeHtml(lastName.trim()),
      email: sanitizeHtml(email.trim().toLowerCase()),
      firmName: sanitizeHtml(firmName.trim()),
      phoneNumber: sanitizeHtml(phoneNumber.trim()),
      profilePicture: profilePicture ? sanitizeHtml(profilePicture.trim()) : "",
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

    if (!/^\+?92[0-9]{10}$|^0[3][0-9]{9}$/.test(sanitizedData.phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phone number. Use format like 03335759985 or +923335759985",
      });
    }

    const existingLawyer = await Lawyer.findOne({ email: sanitizedData.email });
    if (existingLawyer) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const lawyer = new Lawyer({
      ...sanitizedData,
      password,
      feeSecurityKey,
      profilePicture: sanitizedData.profilePicture,
      verificationCode,
      verificationCodeExpires,
      subscription: {
        plan: "Professional",
        status: "Pending",
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await lawyer.save();
    console.log("Lawyer saved successfully:", lawyer._id);

    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: sanitizedData.email,
        subject: "Verify Your Lawyer's Case Diary Account",
        html: `
          <h2>Welcome to Lawyer's Case Diary!</h2>
          <p>Please use the following code to verify your email address:</p>
          <h3>${verificationCode}</h3>
          <p>This code will expire at ${new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toLocaleString()}</p>
        `,
      });
      console.log(
        "Verification email sent successfully to:",
        sanitizedData.email
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res
      .status(201)
      .json({ message: "Account created. Please verify your email." });
  } catch (err) {
    console.error("Signup error details:", err);
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

// POST login
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    const lawyer = await Lawyer.findOne({ email: sanitizedEmail });

    if (!lawyer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!lawyer.isVerified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const isPasswordValid = await lawyer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: lawyer._id, email: lawyer.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: lawyer._id,
        firstName: lawyer.firstName,
        lastName: lawyer.lastName,
        email: lawyer.email,
        firmName: lawyer.firmName,
        phoneNumber: lawyer.phoneNumber,
        profilePicture: lawyer.profilePicture,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// POST verify email
router.post("/verify-email", async (req: Request, res: Response) => {
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
    await lawyer.save({ validateModifiedOnly: true });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email error:", err);
    if (err instanceof MongooseError.ValidationError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: err.errors });
    }
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// POST resend verification code
router.post(
  "/resend-verification",
  resendLimiter,
  async (req: Request, res: Response) => {
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
      const verificationCodeExpires = new Date(
        Date.now() + 48 * 60 * 60 * 1000
      );
      lawyer.verificationCode = verificationCode;
      lawyer.verificationCodeExpires = verificationCodeExpires;

      await lawyer.save();
      console.log(
        "New verification code generated and saved for:",
        sanitizedEmail
      );

      try {
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
          to: sanitizedEmail,
          subject: "Verify Your Lawyer's Case Diary Account",
          html: `
          <h2>Welcome to Lawyer's Case Diary!</h2>
          <p>Please use the following code to verify your email address:</p>
          <h3>${verificationCode}</h3>
          <p>This code will expire at ${new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toLocaleString()}</p>
        `,
        });
        console.log(
          "Resend verification email sent successfully to:",
          sanitizedEmail
        );
      } catch (emailError) {
        console.error("Failed to send resend verification email:", emailError);
        return res
          .status(500)
          .json({ error: "Failed to send verification email" });
      }

      res.json({ message: "Verification code resent successfully" });
    } catch (err) {
      console.error("Resend verification error details:", err);
      if (err instanceof MongooseError) {
        return res.status(500).json({ error: "Database error during resend" });
      }
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  }
);

// POST complete subscription
router.post("/complete-subscription", async (req: Request, res: Response) => {
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

    lawyer.subscription = lawyer.subscription || {
      plan: "Professional",
      status: "Pending",
      trialEnd: new Date(),
    };
    lawyer.subscription.status = "Active";
    await lawyer.save();

    res.json({ message: "Subscription completed successfully" });
  } catch (err) {
    console.error("Complete subscription error:", err);
    res.status(500).json({ error: "Failed to process subscription" });
  }
});

// GET user info (authenticated)
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const lawyer = await Lawyer.findById((req as any).user.id).select(
      "-password -feeSecurityKey -verificationCode -verificationCodeExpires"
    );

    if (!lawyer) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: lawyer._id,
        firstName: lawyer.firstName,
        lastName: lawyer.lastName,
        email: lawyer.email,
        firmName: lawyer.firmName,
        phoneNumber: lawyer.phoneNumber,
        profilePicture: lawyer.profilePicture,
        twoFactorEnabled: lawyer.twoFactorEnabled,
        sessionTimeout: lawyer.sessionTimeout,
        loginAlerts: lawyer.loginAlerts,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
});

// PUT update profile
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const lawyerId = (req as any).user.id;
      const { firstName, lastName, email, phoneNumber, profilePicture } =
        req.body;

      if (!firstName || !lastName || !email) {
        console.error(
          "Invalid profile data for lawyerId:",
          lawyerId,
          "Received:",
          req.body
        );
        return res
          .status(400)
          .json({ error: "First name, last name, and email are required" });
      }

      const sanitizedData = {
        firstName: sanitizeHtml(firstName.trim()),
        lastName: sanitizeHtml(lastName.trim()),
        email: sanitizeHtml(email.trim().toLowerCase()),
        phoneNumber: phoneNumber ? sanitizeHtml(phoneNumber.trim()) : "",
        profilePicture: profilePicture
          ? sanitizeHtml(profilePicture.trim())
          : "",
      };

      if (!validator.isEmail(sanitizedData.email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      if (
        sanitizedData.phoneNumber &&
        !/^\+?92[0-9]{10}$|^0[3][0-9]{9}$/.test(sanitizedData.phoneNumber)
      ) {
        return res.status(400).json({
          error:
            "Invalid phone number. Use format like 03335759985 or +923335759985",
        });
      }

      const existingLawyer = await Lawyer.findOne({
        email: sanitizedData.email,
        _id: { $ne: lawyerId },
      });
      if (existingLawyer) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const updatedLawyer = await Lawyer.findByIdAndUpdate(
        lawyerId,
        {
          $set: {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            email: sanitizedData.email,
            phoneNumber: sanitizedData.phoneNumber,
            profilePicture: sanitizedData.profilePicture,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedLawyer) {
        console.error("Lawyer not found for lawyerId:", lawyerId);
        return res.status(404).json({ error: "Lawyer not found" });
      }

      console.log(
        "Profile updated successfully for lawyerId:",
        lawyerId,
        "Updated data:",
        updatedLawyer
      );

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedLawyer._id,
          firstName: updatedLawyer.firstName,
          lastName: updatedLawyer.lastName,
          email: updatedLawyer.email,
          phoneNumber: updatedLawyer.phoneNumber,
          profilePicture: updatedLawyer.profilePicture,
        },
      });
    } catch (err: any) {
      console.error("Update profile error:", err.message);
      if (err instanceof MongooseError.ValidationError) {
        res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      } else if (err instanceof MongooseError && (err as any).code === 11000) {
        res.status(400).json({ error: "Email already in use" });
      } else {
        res
          .status(500)
          .json({ error: err.message || "Failed to update profile" });
      }
    }
  }
);

export default router;
