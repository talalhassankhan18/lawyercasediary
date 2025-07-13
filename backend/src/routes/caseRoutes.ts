import express from 'express';
import mongoose, { Error as MongooseError } from 'mongoose'; // Import MongooseError explicitly
import Case from '../models/case';
import multer from 'multer';
import path from 'path';

const router = express.Router();

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

// GET all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single case by ID
router.get('/:id', async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(case_);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new case
router.post('/', async (req, res) => {
  try {
    const newCase = new Case(req.body);
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else if (err instanceof MongooseError && (err as any).code === 11000) { // Type assertion for code
      res.status(400).json({ error: 'Case number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create case' });
    }
  }
});

// PUT (update case by ID)
router.put('/:id', async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(updatedCase);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to update case' });
    }
  }
});

// DELETE a case
router.delete('/:id', async (req, res) => {
  try {
    const case_ = await Case.findByIdAndDelete(req.params.id);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json({ message: 'Case deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// POST upload documents for a case
router.post('/:id/documents', upload.array('documents', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const filePaths = files.map(file => file.path);
    const case_ = await Case.findById(req.params.id);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    case_.documents = [...(case_.documents || []), ...filePaths];
    await case_.save();
    res.status(201).json({ message: 'Documents uploaded and associated with case', filePaths });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

export default router;