const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 15000,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
});

module.exports = transporter;