var express = require('express');
var router = express.Router();
const campaign = require('../models/campaign');
const {addJob} = require('../models/jobs');
const sendgrid = require('../utils/sendgrid');

router.get('/getList', function (req, res) {
    campaign.listAll(req.user.userId).then(data => {
        res.publish(true, 'Success', data);
    }, (err) => {
        res.publish(false, 'False', err);
    });
});


router.get('/get', function (req, res) {
    campaign.list(req.user.userId, req.query.campaignId).then(data => {
        res.publish(true, 'Success', data);
    }, (err) => {
        res.publish(false, 'False', err);
    });
});


router.post('/createOrUpdate', function (req, res) {
    campaign.createOrUpdate({userId: req.user.userId, ...req.body}).then(data => {
        res.publish(true, 'Success', data);
    }, (err) => {
        res.publish(false, 'False', err);
    });
});

router.post('/send-notification', function (req, res) {
    sendgrid.createCampaign(req.body.name).then((resp) => {
        addJob({
            name: req.body.campaignId,
            displayName: `Notification - ${req.body.campaignId}`,
            schedule: req.body.schedule,
            executionTime: req.body.executionTime,
            timezone: 'Asia/Kolkata', // TODO - Fix this when support is added
            userId: req.user.userId,
            payload: {
                listId: req.body.listId,
                userId: req.user.userId,
                audienceId: req.body.audienceId,
                sgCampaignId: resp.data.id,
                subject: req.body.subject,
                content: req.body.content,
            }
        });
        res.publish(true, 'Success', {});
    }).catch((e) => {
        res.publish(false, 'False', e.message);
    });
});

module.exports = router;
