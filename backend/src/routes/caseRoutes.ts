import express from 'express';
import Case from '../models/case';

const router = express.Router();

// @route   GET /api/cases
// @desc    Get all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find();
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

// @route   POST /api/cases
// @desc    Add a new case
router.post('/', async (req, res) => {
  try {
    const newCase = new Case(req.body);
    const savedCase = await newCase.save();
    res.status(201).json(savedCase);
  } catch (error) {
    res.status(400).json({ message: 'Failed to add case', error });
  }
});

// @route   DELETE /api/cases/:id
// @desc    Delete a case by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await Case.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.status(200).json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting case', error });
  }
});

// @route   PUT /api/cases/:id
// @desc    Update a case by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: 'Error updating case', error });
  }
});

export default router;
