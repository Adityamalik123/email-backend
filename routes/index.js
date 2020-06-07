var express = require('express');
var router = express.Router();
let redis = require('redis');
let crypto = require('crypto');

let redisClient = require('../db/redis').redisClient;
const user = require('../models/user');

// TODO - Need to move to Utils - Used at 2-3 places
let generateKey = function() {
    let sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

router.post('/login', function(req, res) {
    if (!req.body.userId || !req.body.password) {
        return res.publish(false, 'id or pass not present', {});
    }
    user.verify(req.body.userId, req.body.password).then((data) => {
        const xid = generateKey();
        res.cookie('xid', xid, { maxAge: 86400000, httpOnly: true });
        redisClient.set(xid, JSON.stringify(data), redis.print);
        res.publish(true, 'user found', data);
    }, () => {
        res.publish(false, 'user not found', {});
    });
});

module.exports = router;
