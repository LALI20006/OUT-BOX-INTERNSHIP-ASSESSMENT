"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _client = require('@prisma/client');
var _emailQueue = require('../queue/emailQueue');

const prisma = new (0, _client.PrismaClient)();

 const scheduleEmail = async (to, subject, body, scheduledAt) => {
  // Save in database
  const email = await prisma.email.create({
    data: {
      to,
      subject,
      body,
      scheduledAt,
      status: 'SCHEDULED',
    },
  });

  const delay = Math.max(0, scheduledAt.getTime() - Date.now());

  // Add to BullMQ
  await _emailQueue.emailQueue.add(
    'send-email',
    { emailId: email.id },
    {
      jobId: `email-${email.id}`,
      delay,
    }
  );

  return email;
}; exports.scheduleEmail = scheduleEmail;

 const cancelEmail = async (id) => {
  const email = await prisma.email.findUnique({ where: { id } });
  if (!email) throw new Error('Email not found');
  if (email.status !== 'SCHEDULED') throw new Error('Only scheduled emails can be cancelled');

  // Mark as cancelled in DB
  await prisma.email.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  // Remove from queue
  const jobId = `email-${id}`;
  const job = await _emailQueue.emailQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }

  return { success: true, message: 'Email cancelled successfully' };
}; exports.cancelEmail = cancelEmail;

 const getEmails = async () => {
  return prisma.email.findMany({
    orderBy: { createdAt: 'desc' },
  });
}; exports.getEmails = getEmails;
