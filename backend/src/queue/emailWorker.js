"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _bullmq = require('bullmq');
var _nodemailer = require('nodemailer'); var _nodemailer2 = _interopRequireDefault(_nodemailer);
var _redis = require('../config/redis');
var _mailer = require('../config/mailer');
var _client = require('@prisma/client');
var _emailQueue = require('./emailQueue');

const prisma = new (0, _client.PrismaClient)();

 const initWorker = () => {
  const worker = new (0, _bullmq.Worker)(
    _emailQueue.EMAIL_QUEUE_NAME,
    async (job) => {
      const emailId = job.data.emailId;
      
      // Update DB state to PROCESSING
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'PROCESSING', retries: job.attemptsMade },
      });

      const email = await prisma.email.findUnique({ where: { id: emailId } });
      if (!email) throw new Error(`Email ${emailId} not found in DB`);
      if (email.status === 'CANCELLED') {
        console.log(`Job skipped because email ${emailId} was cancelled.`);
        return { skipped: true, reason: 'CANCELLED' };
      }

      console.log(`Processing email job ${job.id} for email ${emailId}`);

      try {
        const info = await _mailer.transporter.sendMail({
          from: '"Scheduler App" <test@ethereal.email>',
          to: email.to,
          subject: email.subject,
          html: email.body,
        });

        const previewUrl = _nodemailer2.default.getTestMessageUrl(info) || null;

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            previewUrl,
          },
        });

        console.log(`Email ${emailId} sent successfully. Preview URL: ${previewUrl}`);
        return { success: true, previewUrl };
      } catch (error) {
        throw new Error(error.message || 'Failed to send email');
      }
    },
    {
      connection: _redis.redisConnection,
      concurrency: 5,
      limiter: {
        max: 5,
        duration: 1000,
      },
    }
  );

  worker.on('failed', async (job, err) => {
    if (job) {
      console.error(`Job ${job.id} failed: ${err.message}`);
      const emailId = job.data.emailId;
      if (emailId) {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'FAILED',
            errorMessage: err.message,
            retries: job.attemptsMade,
          },
        });
      }
    }
  });

  console.log('Email Worker initialized and listening to queue...');
}; exports.initWorker = initWorker;
