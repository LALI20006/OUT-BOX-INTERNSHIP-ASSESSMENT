"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _cors = require('cors'); var _cors2 = _interopRequireDefault(_cors);
var _env = require('./config/env');
var _mailer = require('./config/mailer');
var _emailWorker = require('./queue/emailWorker');
var _queueReconciler = require('./queue/queueReconciler');
var _emailRoutes = require('./routes/emailRoutes'); var _emailRoutes2 = _interopRequireDefault(_emailRoutes);
var _healthRoutes = require('./routes/healthRoutes'); var _healthRoutes2 = _interopRequireDefault(_healthRoutes);

const app = _express2.default.call(void 0, );

app.use(_cors2.default.call(void 0, ));
app.use(_express2.default.json());

// API Routes
app.use('/api/emails', _emailRoutes2.default);
app.use('/api/health', _healthRoutes2.default);

const startServer = async () => {
  try {
    console.log('Initializing Mailer...');
    await _mailer.initMailer.call(void 0, );

    console.log('Reconciling Queue...');
    await _queueReconciler.reconcileQueueOnStartup.call(void 0, );

    console.log('Initializing Worker...');
    _emailWorker.initWorker.call(void 0, );

    app.listen(_env.config.port, () => {
      console.log(`🚀 Server running on http://localhost:${_env.config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
