'use strict';
let Sequelize = require('sequelize');
const config = require('../config');

const host = config.MYSQL.HOST;

console.log('MySQL host - ' + host);

let sequelize = new Sequelize('scheduler', config.MYSQL.USER, config.MYSQL.PASSWORD, {
    host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    omitNull: true,
    logging: function (str) {
        // do your own logging
    }
});

module.exports = sequelize;
