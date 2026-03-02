import cron from "node-cron";
import nodemailer from "nodemailer";
import Case from "./models/case";
import Lawyer from "./models/Lawyer";
import connectDB from "./dbconnect";

// Reusing same email setup as LawyerRoutes
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const runHearingReminders = async () => {
    console.log("Running Daily Hearing Reminders check...");
    try {
        await connectDB();

        // Find Date exactly 3 days from today
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        const targetDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

        console.log(`Checking for hearings on ${targetDateStr}...`);

        const upcomingCases = await Case.find({ nextHearing: targetDateStr, status: { $ne: "Closed" } });

        if (!upcomingCases || upcomingCases.length === 0) {
            console.log("No upcoming hearings found for 3 days from now.");
            return { success: true, count: 0 };
        }

        // Group cases by Lawyer ID to send one digest email per lawyer
        const lawyerCasesMap: Record<string, any[]> = {};
        upcomingCases.forEach(c => {
            if (!lawyerCasesMap[c.lawyerId]) lawyerCasesMap[c.lawyerId] = [];
            lawyerCasesMap[c.lawyerId].push(c);
        });

        let emailsSent = 0;
        for (const [lawyerId, cases] of Object.entries(lawyerCasesMap)) {
            const lawyer = await Lawyer.findById(lawyerId);
            if (!lawyer || !lawyer.email) continue;

            const caseListHtml = cases.map(c =>
                `<li><strong>${c.title} (Case #${c.caseNumber})</strong><br/>
         Court: ${c.court || 'N/A'}<br/>
         Client: ${c.client.name}</li>`
            ).join("<br/>");

            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || "Lawyer's Case Diary"}" <${process.env.EMAIL_USER}>`,
                to: lawyer.email,
                subject: `Reminder: You have ${cases.length} hearing(s) coming up in 3 days.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1e3a8a;">Upcoming Hearing Reminder</h2>
            <p>Dear ${lawyer.firstName} ${lawyer.lastName},</p>
            <p>This is an automated reminder that you have <strong>${cases.length}</strong> case hearing(s) scheduled for <strong>${targetDateStr}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <ul style="list-style: none; padding-left: 0; margin: 0;">
                ${caseListHtml}
              </ul>
            </div>
            
            <p style="margin-top: 20px;">Please ensure all necessary files and documents are prepared.</p>
            <p>Best regards,<br/><strong>Lawyers Case Diary System</strong></p>
          </div>
        `,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Reminder email sent to ${lawyer.email} for ${cases.length} cases.`);
                emailsSent++;
            } catch (err) {
                console.error(`Failed to send reminder to ${lawyer.email}:`, err);
            }
        }

        return { success: true, count: emailsSent };
    } catch (error) {
        console.error("Error running hearing reminders:", error);
        return { success: false, error };
    }
};

export const startCronJobs = () => {
    // Run every day at 08:00 AM
    cron.schedule("0 8 * * *", () => {
        runHearingReminders();
    });
    console.log("✅ Cron Service initialized. Daily reminders scheduled for 08:00 AM");
};
