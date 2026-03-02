const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const lawyerSchema = new mongoose.Schema({}, { strict: false });
const Lawyer = mongoose.model('Lawyer', lawyerSchema, 'lawyers'); // specify collection name if different

const caseSchema = new mongoose.Schema({}, { strict: false });
const Case = mongoose.model('Case', caseSchema, 'cases');

async function test() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const lawyers = await Lawyer.find({});
        console.log("Lawyers found:", lawyers.length);
        lawyers.forEach(l => console.log(`- ${l.email} (ID: ${l._id})`));

        if (lawyers.length > 0) {
            const firstLawyerId = lawyers[0]._id.toString();
            const cases = await Case.find({ lawyerId: firstLawyerId });
            console.log(`Cases for ${lawyers[0].email}:`, cases.length);
            cases.forEach(c => console.log(`  - ${c.title} (Case #: ${c.caseNumber})`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
