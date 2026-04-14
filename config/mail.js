const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: "kishorevijay0010@gmail.com",
    pass: "afub pmwb htbf yuce" // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;