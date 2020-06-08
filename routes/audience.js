var express = require('express');
const multer = require('multer');
const fs = require('fs');
var router = express.Router();
var path = require('path');

const config = require('../config.js');
const audienceMetadata = require('../models/audienceMetadata');
const audience = require('../models/audience');
const {pushToTable} = require('../utils/audience');

let storage = multer.memoryStorage();
let upload = multer({storage: storage, limits: {fileSize: 2.1e+7}});

let randomString = function (length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
};

/**
 * CRUD -
 */

router.get('/getMeta', function(req, res) {
    audienceMetadata.getMeta(req.user.userId).then((data) => {
        res.publish(true, 'Found AudienceMeta', data);
    }, () => {
        res.publish(false, 'Error Occurred', []);
    });
});

router.post('/create', function(req, res) {
    audienceMetadata.saveMeta({...req.body, userId: req.user.userId}).then((data) => {
        res.publish(true, 'Added AudienceInfo', data);
    }, () => {
        res.publish(false, 'Error Occurred', {});
    });
});

router.get('/records/:audienceId/:page-:limit', function(req, res) {
    audience.fetchRecords(req.user.userId, req.params.audienceId, parseInt(req.params.page), parseInt(req.params.limit)).then((data) => {
        res.publish(true, 'Found Data', data);
    }, () => {
        res.publish(false, 'Error Occurred', []);
    });
});

router.get('/getMetaById/:audienceId', function(req, res) {
    audienceMetadata.getMetaById(req.params.audienceId, req.user.userId).then((data) => {
        res.publish(true, 'Found MetaData', data);
    }, () => {
        res.publish(false, 'Error Occurred', []);
    });
});

/**
 * File Link Generation
 */

router.post('/upload-link', upload.single('file'), function(req, res) {
    let ext = req.file.originalname && req.file.originalname.lastIndexOf(".") !== -1 ? req.file.originalname.substring(req.file.originalname.lastIndexOf(".") + 1) : "";
    let name = randomString(12, "aA#") + (new Date().getTime()) + "." + ext;
    fs.writeFile(path.join(__dirname, "../public/" + name), req.file.buffer, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
    res.send({url: config.scheme + "://" + req.hostname + "/api/backend/" + name});
});

/**
 * Upload Audience Data
 */

router.post('/upload-data', function(req, res) {
    pushToTable(req.user.userId, req.body.url, req.body.audienceId);
    res.publish(true, 'Records Pushed', {});
});

module.exports = router;
