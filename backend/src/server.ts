import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectToDatabase } from './dbconnect';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for React frontend
app.use(express.json()); // Parse JSON bodies

// Sample API endpoint to fetch all cases from 'cases' collection
app.get('/api/cases', async (req: Request, res: Response) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('cases');
    const cases = await collection.find({}).toArray();
    res.status(200).json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Sample API endpoint to add a case
app.post('/api/cases', async (req: Request, res: Response) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('cases');
    const result = await collection.insertOne(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding case:', error);
    res.status(500).json({ error: 'Failed to add case' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});