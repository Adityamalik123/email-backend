const shortid = require('shortid');

let config;

config = {
    name: shortid.generate(),
    scheme: 'http',
    HOST: 'localhost',
    MYSQL: {
        USER: 'root',
        PASSWORD: 'password',
        HOST: 'localhost'
    },
    REDIS: {
        'HOST': 'localhost',
        'PORT': 6379
    },
    MONGODB: {
        'URL': 'mongodb://localhost:27017'
    }
};

module.exports = config;
