var express = require('express');
var router = express.Router();
const jobs = require('../models/jobs');

router.get('/getList', function(req, res) {
    jobs.getAllJobsByUserId(req.user.userId).then((data) => {
        res.publish(true, 'data present', data);
    }, () => {
        res.publish(false, 'data not found', {});
    });
});

module.exports = router;