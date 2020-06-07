var express = require('express');
var router = express.Router();
let redisClient = require('../db/redis').redisClient;

router.get('/getLoggedInUser', function(req, res) {
    res.publish(true, "success", req.user);
});

router.get('/logout', function(req, res) {
    let xid = req.cookies['xid'];
    redisClient.del(xid);
    res.clearCookie('xid', { secure: true });
    res.sendStatus(200);
});

module.exports = router;
