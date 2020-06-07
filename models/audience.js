const mongoosePaginate = require('mongoose-paginate-v2');
const db = require('../db/mongo').notification;
const mongoose = require('../db/mongo').mongoose;

const audienceSchema = mongoose.Schema({
    userId: String,
    name: String,
    listId: String,
    audienceId: String,
    email: String,
    updated: {
        type: Date,
        default: Date.now
    },
    inserted: {
        type: Date,
        default: Date.now
    }
}, {strict: true});

audienceSchema.index({userId: 1, audienceId: 1, email: 1});
audienceSchema.index({userId: 1, listId: 1, email: 1});

audienceSchema.plugin(mongoosePaginate);

let Audiences = db.model('audience', audienceSchema, 'audience');

function getData (userId, audienceId, recordId, size = 1000) {
    let record = {
        userId,
        audienceId
    };
    if (recordId) {
        record._id = {'$gt': recordId};
    }
    return Audiences.find(record).sort({'_id': 1}).limit(size).lean();
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

const bulkRecordPush = (records) => {
    return Audiences.insertMany(records);
};

module.exports = {
    fetchRecords,
    bulkRecordPush,
    getData
};
