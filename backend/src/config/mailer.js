"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodemailer = require('nodemailer'); var _nodemailer2 = _interopRequireDefault(_nodemailer);
var _env = require('./env');

 exports.transporter;

 async function initMailer() {
  if (_env.config.ethereal.user && _env.config.ethereal.pass) {
    exports.transporter = _nodemailer2.default.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: _env.config.ethereal.user,
        pass: _env.config.ethereal.pass,
      },
    });
    console.log('Nodemailer initialized with provided Ethereal credentials.');
  } else {
    // Generate test account
    console.log('No Ethereal credentials found, creating test account...');
    const testAccount = await _nodemailer2.default.createTestAccount();
    exports.transporter = _nodemailer2.default.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Auto-generated Ethereal credentials:');
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
  }
} exports.initMailer = initMailer;
