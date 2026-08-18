"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _client = require('@prisma/client');
var _emailQueue = require('./emailQueue');

const prisma = new (0, _client.PrismaClient)();

 const reconcileQueueOnStartup = async () => {
  console.log('Running queue reconciler on startup...');
  
  // Get all emails that are supposed to be scheduled or processing
  const emails = await prisma.email.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'PROCESSING'],
      },
    },
  });

  if (emails.length === 0) {
    console.log('Queue reconciler: No pending emails found.');
    return;
  }

  // Check jobs in Redis
  const activeJobs = await _emailQueue.emailQueue.getJobs(['delayed', 'waiting', 'active']);
  const activeJobIds = activeJobs.map(job => job.id);

  let recoveredCount = 0;
  for (const email of emails) {
    const expectedJobId = `email-${email.id}`;
    
    // If the job is missing from Redis (due to crash or cache clear)
    if (!activeJobIds.includes(expectedJobId)) {
      console.log(`Reconciler: Recovering missing job for email ${email.id}`);
      
      const delay = Math.max(0, new Date(email.scheduledAt).getTime() - Date.now());
      
      await _emailQueue.emailQueue.add(
        'send-email',
        { emailId: email.id },
        { 
          jobId: expectedJobId,
          delay 
        }
      );
      
      if (email.status === 'PROCESSING') {
        // Reset status to SCHEDULED since we just re-queued it
        await prisma.email.update({
          where: { id: email.id },
          data: { status: 'SCHEDULED' },
        });
      }
      
      recoveredCount++;
    }
  }

  console.log(`Queue reconciler finished. Recovered ${recoveredCount} orphaned emails.`);
}; exports.reconcileQueueOnStartup = reconcileQueueOnStartup;
