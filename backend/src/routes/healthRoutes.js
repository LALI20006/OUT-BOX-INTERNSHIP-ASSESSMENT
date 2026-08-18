"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _express = require('express');
var _emailQueue = require('../queue/emailQueue');

const router = _express.Router.call(void 0, );

router.get('/queue', async (req, res) => {
  try {
    const active = await _emailQueue.emailQueue.getActiveCount();
    const delayed = await _emailQueue.emailQueue.getDelayedCount();
    const waiting = await _emailQueue.emailQueue.getWaitingCount();
    const failed = await _emailQueue.emailQueue.getFailedCount();
    const completed = await _emailQueue.emailQueue.getCompletedCount();

    res.json({
      metrics: {
        active,
        delayed,
        waiting,
        failed,
        completed
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports. default = router;
