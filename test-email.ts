import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

async function test() {
    console.log("Testing email sending with port 465...");
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: "alaa@overseas-travels.com", // send to self to test
            subject: "Test email",
            text: "This is a test email"
        });
        console.log("Success:", info);
    } catch (e) {
        console.log("Error:", e);
    }
}

test();
