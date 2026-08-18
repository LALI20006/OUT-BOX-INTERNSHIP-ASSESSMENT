"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _bullmq = require('bullmq');
var _redis = require('../config/redis');

 const EMAIL_QUEUE_NAME = 'email-queue'; exports.EMAIL_QUEUE_NAME = EMAIL_QUEUE_NAME;

 const emailQueue = new (0, _bullmq.Queue)(exports.EMAIL_QUEUE_NAME, {
  connection: _redis.redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
}); exports.emailQueue = emailQueue;
