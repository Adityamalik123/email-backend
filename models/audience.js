const mongoosePaginate = require('mongoose-paginate-v2');
const db = require('../db/mongo').notification;
const mongoose = require('../db/mongo').mongoose;

const audienceSchema = mongoose.Schema({
    userId: String,
    name: String,
    audienceId: String,
    email: String,
    unsubscribe: {
        type: Array,
        default: []
    },
    updated: {
        type: Date,
        default: Date.now
    },
    inserted: {
        type: Date,
        default: Date.now
    }
}, {strict: true});

audienceSchema.index({audienceId: 1, unsubscribe: 1});
audienceSchema.index({userId: 1, audienceId: 1, email: 1});
audienceSchema.index({_id: 1, audienceId: 1, userId: 1});

audienceSchema.plugin(mongoosePaginate);

let Audiences = db.model('audience', audienceSchema, 'audience');

function getData (userId, audienceId, recordId, size = 1000) {
    let record = {_id: {$gt: recordId || '3ad897280000000000000000'}, userId, audienceId};
    return Audiences.find(record).hint({'_id': 1, 'audienceId': 1, 'userId': 1}).limit(size).lean();
}

const fetchRecords = function (userId, audienceId, page, limit) {
    const query = {userId, audienceId};
    const options = {
        sort: {inserted: -1},
        lean: true,
        limit,
        page
    };
    return Audiences.paginate(query, options).then((docs) => {
        return Promise.resolve(docs);
    });
};

const updateRecord = function (userId, audienceId, email, campaignId) {
    const query = {userId, audienceId, email};
    return Audiences.findOneAndUpdate(query, { $push: { unsubscribe: campaignId}}).lean();
};

const bulkRecordPush = (records) => {
    return Audiences.insertMany(records);
};

module.exports = {
    fetchRecords,
    bulkRecordPush,
    getData,
    updateRecord
};
