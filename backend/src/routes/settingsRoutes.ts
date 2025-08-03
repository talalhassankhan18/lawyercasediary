import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Settings from "../models/Settings";
import Lawyer from "../models/Lawyer";
import connectDB from "../dbconnect";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

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

const router = express.Router();

// JWT authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// GET lawyer's settings
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const lawyer = await Lawyer.findById(lawyerId).select(
      "firstName lastName email phoneNumber profilePicture twoFactorEnabled sessionTimeout loginAlerts"
    );
    const settings = await Settings.findOne({ lawyerId });
    if (!lawyer) {
      console.error("Lawyer not found for lawyerId:", lawyerId);
      return res.status(404).json({ error: "Lawyer not found" });
    }
    console.log(
      "Fetched settings for lawyerId:",
      lawyerId,
      "Lawyer data:",
      lawyer,
      "Settings data:",
      settings
    );
    res.json({
      profile: {
        name: `${lawyer.firstName} ${lawyer.lastName}`,
        email: lawyer.email,
        phone: lawyer.phoneNumber || "",
        barNumber: settings?.profile.barNumber || "",
        experience: settings?.profile.experience || "",
        specialization: settings?.profile.specialization || "",
        address: settings?.profile.address || "",
        bio: settings?.profile.bio || "",
        profilePicture: lawyer.profilePicture || "",
      },
      security: {
        twoFactorEnabled: lawyer.twoFactorEnabled,
        sessionTimeout: lawyer.sessionTimeout,
        loginAlerts: lawyer.loginAlerts,
        feeManagementPin: "",
      },
    });
  } catch (err: any) {
    console.error("Get settings error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch settings" });
  }
});

// POST/UPDATE profile picture
router.post(
  "/profile-picture",
  authenticateToken,
  upload.single("profilePicture"),
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      if (!req.file) {
        console.error("No file uploaded for lawyerId:", lawyerId);
        return res.status(400).json({ error: "No image file provided" });
      }

      const profilePicture = req.file.path; // Cloudinary URL
      console.log("Profile picture uploaded to Cloudinary:", profilePicture);

      // Update Lawyer model
      await Lawyer.findByIdAndUpdate(
        lawyerId,
        { profilePicture, updatedAt: new Date() },
        { runValidators: true }
      );
      console.log("Lawyer profile picture updated for lawyerId:", lawyerId);

      // Update Settings model
      const settings = await Settings.findOneAndUpdate(
        { lawyerId },
        {
          $set: {
            "profile.profilePicture": profilePicture,
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      console.log(
        "Settings profile picture updated successfully for lawyerId:",
        lawyerId,
        "URL:",
        profilePicture
      );
      res.json({
        message: "Profile picture updated successfully",
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

// POST/UPDATE profile settings
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const { profile } = req.body;
      if (!profile || !profile.name || !profile.email) {
        console.error(
          "Invalid profile data for lawyerId:",
          lawyerId,
          "Received:",
          profile
        );
        return res
          .status(400)
          .json({ error: "Profile data with name and email is required" });
      }
      console.log(
        "Updating profile for lawyerId:",
        lawyerId,
        "with data:",
        profile
      );
      const updatedSettings = await Settings.findOneAndUpdate(
        { lawyerId },
        {
          $set: {
            profile: {
              name: profile.name,
              email: profile.email,
              phone: profile.phone || "",
              barNumber: profile.barNumber || "",
              experience: profile.experience || "",
              specialization: profile.specialization || "",
              address: profile.address || "",
              bio: profile.bio || "",
              profilePicture: profile.profilePicture || "",
            },
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      console.log(
        "Profile updated successfully for lawyerId:",
        lawyerId,
        "Updated data:",
        updatedSettings.profile
      );
      res.json(updatedSettings);
    } catch (err: any) {
      console.error("Update profile error:", err.message);
      if (err instanceof mongoose.Error.ValidationError) {
        res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      } else {
        res
          .status(500)
          .json({ error: err.message || "Failed to update profile" });
      }
    }
  }
);

// POST/UPDATE security settings
router.put(
  "/security",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await connectDB();
      const lawyerId = (req as any).user.id;
      const { currentPassword, newPassword, confirmPassword, security } =
        req.body;

      if (!security) {
        console.error("Security data is missing in request body");
        return res.status(400).json({ error: "Security data is required" });
      }

      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        console.error("Lawyer not found for lawyerId:", lawyerId);
        return res.status(404).json({ error: "Lawyer not found" });
      }

      console.log(
        "Received security update request for lawyerId:",
        lawyerId,
        "with data:",
        { currentPassword, newPassword, security }
      );

      // Handle password update if provided
      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          console.error("Password mismatch");
          return res
            .status(400)
            .json({ error: "New password and confirmation do not match" });
        }
        if (
          !validator.isStrongPassword(newPassword, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          })
        ) {
          console.error("Invalid new password format");
          return res.status(400).json({
            error:
              "New password must be at least 8 characters long with uppercase, lowercase, number, and special character",
          });
        }
        const isMatch = await lawyer.comparePassword(currentPassword);
        if (!isMatch) {
          console.error("Current password incorrect for lawyerId:", lawyerId);
          return res
            .status(401)
            .json({ error: "Current password is incorrect" });
        }
        lawyer.password = newPassword;
        console.log("Password updated for lawyerId:", lawyerId);
      } else if (
        (currentPassword || newPassword || confirmPassword) &&
        !(currentPassword && newPassword && confirmPassword)
      ) {
        console.error("Incomplete password fields provided");
        return res.status(400).json({
          error:
            "All password fields (current, new, confirm) are required for password change",
        });
      }

      // Validate feeManagementPin (feeSecurityKey) if provided
      if (security.feeManagementPin) {
        if (!/^\d{4}$/.test(security.feeManagementPin)) {
          console.error(
            "Invalid feeManagementPin format:",
            security.feeManagementPin
          );
          return res
            .status(400)
            .json({ error: "PIN must be a 4-digit number" });
        }
        lawyer.feeSecurityKey = security.feeManagementPin;
        console.log("FeeSecurityKey updated for lawyerId:", lawyerId);
      }

      // Update security settings if provided
      if (typeof security.twoFactorEnabled !== "undefined") {
        lawyer.twoFactorEnabled = security.twoFactorEnabled;
      }
      if (typeof security.sessionTimeout !== "undefined") {
        lawyer.sessionTimeout = security.sessionTimeout;
      }
      if (typeof security.loginAlerts !== "undefined") {
        lawyer.loginAlerts = security.loginAlerts;
      }

      await lawyer.save();
      console.log(
        "Security settings saved successfully for lawyerId:",
        lawyerId,
        "Updated fields:",
        {
          twoFactorEnabled: lawyer.twoFactorEnabled,
          sessionTimeout: lawyer.sessionTimeout,
          loginAlerts: lawyer.loginAlerts,
        }
      );

      res.json({
        message: "Security settings updated successfully",
        security: {
          twoFactorEnabled: lawyer.twoFactorEnabled,
          sessionTimeout: lawyer.sessionTimeout,
          loginAlerts: lawyer.loginAlerts,
        },
      });
    } catch (err: any) {
      console.error("Update security error:", err.message);
      if (err instanceof mongoose.Error.ValidationError) {
        res
          .status(400)
          .json({ error: "Validation error", details: err.errors });
      } else {
        res
          .status(500)
          .json({ error: err.message || "Failed to update security settings" });
      }
    }
  }
);

export default router;
