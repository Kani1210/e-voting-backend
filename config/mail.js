const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kishorevijay0010@gmail.com",
    pass: "afub pmwb htbf yuce"
  }
});

module.exports = transporter;