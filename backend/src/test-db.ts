
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        console.log('Connecting to:', uri);
        if (!uri) {
            console.error('❌ MONGO_URI is not defined');
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    }
};

testDB();
