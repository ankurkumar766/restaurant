// // utils/mailer.js
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,   // set in environment variables
//     pass: process.env.EMAIL_PASS
//   }
// });

// // simple send function
// async function sendMail({ to, subject, html }) {
//   const info = await transporter.sendMail({
//     from: `"YourSite" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html
//   });
//   return info;
// }

// module.exports = { sendMail };
