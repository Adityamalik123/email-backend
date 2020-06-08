var express = require('express');
var router = express.Router();
let redis = require('redis');
let crypto = require('crypto');
var path = require('path');

const {searchContacts, deleteContacts} = require('../utils/sendgrid');
const {updateRecord} = require('../models/audience');
const config = require('../config.js');

let redisClient = require('../db/redis').redisClient;
const user = require('../models/user');

// TODO - Need to move to Utils - Used at 2-3 places
let generateKey = function() {
    let sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

/**
 * This is the router to log in
 */

router.post('/login', function(req, res) {
    if (!req.body.userId || !req.body.password) {
        return res.publish(false, 'id or pass not present', {});
    }
    user.verify(req.body.userId, req.body.password).then((data) => {
        const xid = generateKey();
        let userDetails = {
            name: data.name,
            userId: data.userId
        };
        res.cookie('xid', xid, { maxAge: 86400000, httpOnly: true });
        redisClient.set(xid, JSON.stringify(userDetails), redis.print);
        res.publish(true, 'user found', userDetails);
    }, () => {
        res.publish(false, 'user not found', {});
    });
});

/**
 * This is the router for un-subscribing from a campaign
 */

router.get('/unsubscribe/:data', function(req, res) {
    res.render(path.join(__dirname, "../public/unsubscribe"), {
        data: req.params.data,
        hostname: req.hostname,
        scheme: config.scheme,
        email: req.query.email
    });
    try {
        const data = JSON.parse(Buffer.from(decodeURIComponent(req.params.data), 'base64').toString());
         searchContacts({ "query": `email LIKE '${req.query.email}' AND CONTAINS(list_ids, '${data.listId}')` }).then((resp) => {
            if (resp.data && resp.data.result && resp.data.result.length > 0) {
                deleteContacts(resp.data.result[0].id).then(() => {
                    updateRecord(data.userId, data.audienceId, req.query.email, data.campaignId).catch((e) => {
                        console.log(e);
                    });
                }, (e) => {
                    console.log(e);
                })
            }
        }, (e) => {
            console.log(e);
        });
    } catch (e) {
        console.log(e, 'err');
    }
});

router.get('/resubscribe/:data', function(req, res) {
    res.render(path.join(__dirname, "../public/resubscribe"), {
        email: req.query.email
    });
    try {
        // TODO - Add Logic
        // const data = JSON.parse(Buffer.from(decodeURIComponent(req.params.data), 'base64').toString());
        // console.log(data, 'data')
        //  addUpdateContacts({list_ids:[data.listId], contacts}).then((res) => {
        //      // Mark subscribed in db
        // }, (e) => {
        //     console.log(JSON.stringify(e), 'Contacts API Issue SG');
        // });
    } catch (e) {
        console.log(e, 'err');
    }
});

module.exports = router;
