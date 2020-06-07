const bcrypt = require('bcryptjs');
const db = require('../db/mongo').login;
const mongoose = require('../db/mongo').mongoose;

const userSchema = mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    userId: {
        required: true,
        type: String
    },
    password: String,
    created: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({userId: 1});

let user = db.model('user', userSchema, 'user');

const verify = function (userId, password) {
    return user.findOne({userId}).then((data) => {
        if (!data) {
            return Promise.reject();
        }
        return bcrypt.compare(password, data.password).then(result => {
            if (result) {
                return Promise.resolve(data);
            }
            return Promise.reject();
        });
    });
};

// bcrypt.hash('Aditya', 10).then(function(hash) {
//     console.log(hash, 'hash')
// });

module.exports = {
    verify
};
