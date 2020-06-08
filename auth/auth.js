'use strict';
let redis = require('redis');
let redisClient = require('../db/redis').redisClient;

// Middleware
let user = function (xid, callback) {
    if (!xid) {
        return callback('error');
    }
    redisClient.get(xid, function(err, redisResponse) {
        if (redisResponse) {
            redisClient.set(xid, redisResponse, redis.print);
            redisClient.expire(xid, 1800);
            callback(null, JSON.parse(redisResponse));
        } else {
            callback('error');
        }
    });
};

module.exports = {
    user
};
