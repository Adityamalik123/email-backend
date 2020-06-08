const db = require('../db/mongo').notification;
const mongoose = require('../db/mongo').mongoose;
const schema = mongoose.Schema;

const audienceMetadataSchema = mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    listId: String,
    userId: String,
    columns: schema.Types.Mixed,
    updated: {
        type: Date,
        default: Date.now
    },
    created: {
        type: Date,
        default: Date.now
    }
});

// Indexes
audienceMetadataSchema.index({userId: 1});

// DB Object
let AudienceMetadata = db.model('audienceMetadata', audienceMetadataSchema, 'audienceMetadata');

// CRUD for metadata
const saveMeta = function (doc) {
    const newAudienceMetaData = new AudienceMetadata(doc);
    return newAudienceMetaData.save();
};

const getMeta = function (userId) {
    return AudienceMetadata.find({userId}).lean();
};

const getMetaById = function (audienceId, userId) {
    return AudienceMetadata.findOne({_id: audienceId, userId}).lean();
};

module.exports = {
    saveMeta,
    getMeta,
    getMetaById
};
