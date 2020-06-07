const config = require('../config.js');
const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;

const login = mongoose.createConnection(config.MONGODB.URL + '/login');
const notification = mongoose.createConnection(config.MONGODB.URL + '/notification');

module.exports = {
    mongoose,
    notification,
    login
};
