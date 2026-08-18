"use strict";Object.defineProperty(exports, "__esModule", {value: true});
var _emailService = require('../services/emailService');

 const scheduleEmailController = async (req, res) => {
  try {
    const { to, subject, body, scheduledAt } = req.body;
    
    if (!to || !subject || !body || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const email = await _emailService.scheduleEmail.call(void 0, to, subject, body, new Date(scheduledAt));
    res.status(201).json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; exports.scheduleEmailController = scheduleEmailController;

 const cancelEmailController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await _emailService.cancelEmail.call(void 0, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; exports.cancelEmailController = cancelEmailController;

 const getEmailsController = async (req, res) => {
  try {
    const emails = await _emailService.getEmails.call(void 0, );
    res.status(200).json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; exports.getEmailsController = getEmailsController;

// Batch create emails for testing load/concurrency
 const batchCreateController = async (req, res) => {
  try {
    const { count = 10, delaySeconds = 0 } = req.body;
    
    const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
    const emails = [];

    for (let i = 0; i < count; i++) {
      const email = await _emailService.scheduleEmail.call(void 0, 
        `test${i}@example.com`,
        `Batch Email ${i + 1}`,
        `This is a load testing email #${i + 1}`,
        scheduledAt
      );
      emails.push(email);
    }
    
    res.status(201).json({ message: `Successfully scheduled ${count} emails`, emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; exports.batchCreateController = batchCreateController;
