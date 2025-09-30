// const crypto = require('crypto');
// const User = require('../models/User');
// const PasswordReset = require('../models/PasswordReset');
// const { sendResetEmail } = require('../utils/mailer');

// // POST /forgot
// exports.postForgot = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) return res.render('forgot', { msg: 'If that email exists, a reset link has been sent.' });

//   const token = crypto.randomBytes(20).toString('hex');
//   const expires = Date.now() + 3600 * 1000; // 1 hour

//   await PasswordReset.create({ userId: user._id, token, expires });

//   const resetLink = `${req.protocol}://${req.get('host')}/reset/${token}`;
//   await sendResetEmail(user.email, resetLink);

//   res.render('forgot', { msg: 'Password reset link sent to your email.' });
// };

// // GET /reset/:token
// exports.getReset = async (req, res) => {
//   const { token } = req.params;
//   const resetEntry = await PasswordReset.findOne({ token, expires: { $gt: Date.now() } });
//   if (!resetEntry) return res.render('reset', { error: 'Token invalid or expired.' });
//   res.render('reset', { token });
// };

// // POST /reset/:token
// exports.postReset = async (req, res) => {
//   const { token } = req.params;
//   const { password, confirm } = req.body;
//   if (!password || password !== confirm) return res.render('reset', { token, error: 'Passwords do not match.' });

//   const resetEntry = await PasswordReset.findOne({ token, expires: { $gt: Date.now() } });
//   if (!resetEntry) return res.render('reset', { error: 'Token invalid or expired.' });

//   const user = await User.findById(resetEntry.userId);
//   await user.setPassword(password); // assuming User.js has setPassword method
//   await user.save();

//   await PasswordReset.deleteOne({ _id: resetEntry._id }); // clean up

//   res.render('reset-success', { msg: 'Password has been reset. You can now log in.' });
// };
