const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.gmailUser || !env.gmailPassword) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailUser,
      pass: env.gmailPassword,
    },
  });
  return transporter;
}

async function sendVerificationEmail(email, token) {
  const smtp = getTransporter();
  if (!smtp) return false;

  const verifyUrl = `${env.apiBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  await smtp.sendMail({
    from: env.gmailUser,
    to: email,
    subject: "Verify your Email Validator account",
    html: `Click here to verify: <a href="${verifyUrl}">${verifyUrl}</a>`,
  });
  return true;
}

module.exports = { sendVerificationEmail };
