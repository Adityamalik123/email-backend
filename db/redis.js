'use strict';
const config = require('../config.js');
let Redis = require('ioredis');

// Redis client object
const redisClient = new Redis(config.REDIS.PORT, config.REDIS.HOST);

redisClient.on('connect', () => {
    console.log('[REDIS] connected');
});

redisClient.on('ready', () => {
    console.log('[REDIS] ready');
});

redisClient.on('close', () => {
    console.log('[REDIS] connection closed');
});

redisClient.on('reconnecting', () => {
    console.log('[REDIS] reconnecting');
});

redisClient.on('error', (e) => {
    console.log(e, '[REDIS] error');
});

module.exports = {
    redisClient
};
