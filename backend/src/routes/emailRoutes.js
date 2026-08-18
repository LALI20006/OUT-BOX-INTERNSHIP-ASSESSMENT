"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _express = require('express');
var _emailController = require('../controllers/emailController');

const router = _express.Router.call(void 0, );

router.get('/', _emailController.getEmailsController);
router.post('/schedule', _emailController.scheduleEmailController);
router.post('/batch', _emailController.batchCreateController);
router.delete('/:id', _emailController.cancelEmailController);

exports. default = router;
