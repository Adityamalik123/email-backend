const _ = require('lodash');
let crypto = require('crypto');
const db = require('../db/mongo').notification;
const mongoose = require('../db/mongo').mongoose;
const sendgrid = require('../utils/sendgrid');

// Schema -
const campaignSchema = mongoose.Schema({
    userId: {
        required: true,
        type: String
    },
    name: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    file: {
        type: String
    },
    listIdSg: {
        type: String
    },
    campaignIdSg: {
        type: String
    },
    status: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    }
});

// Indexes
campaignSchema.index({userId: 1});

// Db Object
const Campaign = db.model('campaign', campaignSchema, 'campaign');

const listAll = (userId) => {
    return Campaign.find({userId}).sort('-created').lean();
};

const list = (userId, _id) => {
    return Campaign.findOne({_id, userId}).sort('-created').lean();
};

// TODO - Need to move to Utils - Used at 2-3 places
let generateKey = function() {
    let sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

const createOrUpdate = (data) => {
    if (data._id) {
        return Campaign.findOne({_id: data._id, userId: data.userId}).then(doc => {
            if (doc) {
                _.assign(doc, data);
                return doc.save();
            } else {
                return Promise.reject(new Error('campaign-does-not-exist'));
            }
        }, () => {
            return Promise.reject(new Error('campaign-does-not-exist'));
        });
    } else {
        const {userId, name, description} = data;
        const listIdSg = generateKey();
        return sendgrid.createList(listIdSg).then((resp) => {
            let newCampaignObject = {
                userId,
                name,
                description,
                listIdSg: resp.data.id,
            };
            const newObjectToBeSaved = new Campaign(newCampaignObject);
            return newObjectToBeSaved.save();
        }, (e) => {
            return Promise.reject(new Error(e.message));
        });
    }
};

module.exports = {
    listAll,
    createOrUpdate,
    list
};
