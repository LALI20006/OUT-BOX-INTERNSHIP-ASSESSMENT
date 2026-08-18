"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _ioredis = require('ioredis'); var _ioredis2 = _interopRequireDefault(_ioredis);
var _env = require('./env');

 const redisConnection = new (0, _ioredis2.default)({
  host: _env.config.redis.host,
  port: _env.config.redis.port,
  maxRetriesPerRequest: null,
}); exports.redisConnection = redisConnection;

exports.redisConnection.on('error', (err) => {
  console.error('Redis connection error. Please ensure Redis is running.', err.message);
});
