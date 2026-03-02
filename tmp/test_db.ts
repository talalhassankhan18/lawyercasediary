import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lawyer from '../backend/src/models/Lawyer';
import Case from '../backend/src/models/case';

dotenv.config({ path: '../backend/.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to DB");

        const lawyers = await Lawyer.find({});
        console.log("Lawyers found:", lawyers.length);
        lawyers.forEach(l => console.log(`- ${l.email} (ID: ${l._id})`));

        if (lawyers.length > 0) {
            const firstLawyerId = lawyers[0]._id;
            const cases = await Case.find({ lawyerId: firstLawyerId });
            console.log(`Cases for ${lawyers[0].email}:`, cases.length);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
