import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Error as MongooseError } from 'mongoose';
import Case from '../models/case';
import connectDB from '../dbconnect';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// JWT authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// GET all cases for the authenticated lawyer
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const cases = await Case.find({ lawyerId }).sort({ createdAt: -1 });
    res.json(cases);
  } catch (err: any) {
    console.error('Get cases error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch cases' });
  }
});

// GET a single case by ID (ensure it belongs to the authenticated lawyer)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) {
      return res.status(404).json({ error: 'Case not found or not authorized' });
    }
    res.json(case_);
  } catch (err: any) {
    console.error('Get case error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch case' });
  }
});

// POST a new case (associate with authenticated lawyer)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const newCase = new Case({ ...req.body, lawyerId });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err: any) {
    console.error('Post case error:', err.message);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else if ((err as any).code === 11000) {
      res.status(400).json({ error: 'Case number already exists' });
    } else {
      res.status(500).json({ error: err.message || 'Failed to create case' });
    }
  }
});

// PUT (update case by ID, ensure it belongs to the authenticated lawyer)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const updatedCase = await Case.findOneAndUpdate(
      { _id: req.params.id, lawyerId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found or not authorized' });
    }
    res.json(updatedCase);
  } catch (err: any) {
    console.error('Update case error:', err.message);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      res.status(500).json({ error: err.message || 'Failed to update case' });
    }
  }
});

// DELETE a case (ensure it belongs to the authenticated lawyer)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const case_ = await Case.findOneAndDelete({ _id: req.params.id, lawyerId });
    if (!case_) {
      return res.status(404).json({ error: 'Case not found or not authorized' });
    }
    res.json({ message: 'Case deleted' });
  } catch (err: any) {
    console.error('Delete case error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to delete case' });
  }
});

// POST upload documents for a case (ensure it belongs to the authenticated lawyer)
router.post('/:id/documents', authenticateToken, upload.array('documents', 5), async (req: Request, res: Response) => {
  try {
    await connectDB();
    const lawyerId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const filePaths = files.map(file => file.path);
    const case_ = await Case.findOne({ _id: req.params.id, lawyerId });
    if (!case_) {
      return res.status(404).json({ error: 'Case not found or not authorized' });
    }
    case_.documents = [...(case_.documents || []), ...filePaths];
    await case_.save();
    res.status(201).json({ message: 'Documents uploaded and associated with case', filePaths });
  } catch (err: any) {
    console.error('Upload documents error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to upload files' });
  }
});

export default router;