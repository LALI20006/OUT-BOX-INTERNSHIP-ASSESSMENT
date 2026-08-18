"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dotenv = require('dotenv'); var _dotenv2 = _interopRequireDefault(_dotenv);

_dotenv2.default.config();

 const config = {
  port: process.env.PORT || 3000,
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  ethereal: {
    user: process.env.ETHEREAL_USER || null,
    pass: process.env.ETHEREAL_PASS || null,
  }
}; exports.config = config;
