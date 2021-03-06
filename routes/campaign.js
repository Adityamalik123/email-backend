const _ = require('lodash');
var express = require('express');
var router = express.Router();
const campaign = require('../models/campaign');
const {addJob, getData} = require('../models/jobs');
const sendgrid = require('../utils/sendgrid');

/**
 * CRUD and Stats API's -
 */

router.get('/getList', function (req, res) {
    campaign.listAll(req.user.userId).then(data => {
        res.publish(true, 'Success', data);
    }, (err) => {
        res.publish(false, 'False', err);
    });
});


router.get('/stats', function (req, res) {
    getData(req.user.userId, req.query.campaignId).then(async data => {
        let statsArr = await Promise.all(_.map(data, async (i) => {
            return sendgrid.campaignStats(i.payload.sgCampaignId).then((resp) => {
                return Promise.resolve({
                    id: i.payload.sgCampaignId,
                    subject: i.payload.subject,
                    data: _.get(resp, 'data.results[0].stats') || {}
                })
            }, () => {
                return Promise.resolve({
                    id: i.payload.sgCampaignId,
                    subject: i.payload.subject,
                    data: {}
                })
            })
        }));
        res.publish(true, 'Success', statsArr);
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

/**
 * Add Job router - This will push the job in MySql
 */

router.post('/send-notification', function (req, res) {
    try {
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
                subject: req.body.subject,
                content: req.body.content,
            },
            options: req.body.options
        });
        res.publish(true, 'Success', {});
    } catch(e) {
        res.publish(false, 'False', e.message);
    }
});

module.exports = router;
