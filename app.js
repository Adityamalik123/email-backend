var express = require('express');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const auth = require('./auth/auth');
var indexRouter = require('./routes/index');
var audienceRouter = require('./routes/audience');
var campaignRouter = require('./routes/campaign');
var jobsRouter = require('./routes/jobs');
var usersRouter = require('./routes/users');
let redisClient = require('./db/redis').redisClient;
const {startMasterUpload, startMasterSG} = require('./master/task-master');
startMasterUpload();
startMasterSG();

var app = express();

app.use('/health-check', (req, res) => {
    res.send('Working');
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(function (req, res, next) {
    res.publish = (success, message, data) => {
        if (data instanceof Error) {
            let error = data.message;
            data = {error};
            message = error;
        }
        res.send({
            success,
            message: message || '',
            data: data || {}
        });
    };
    next();
});

app.use('/', indexRouter);

app.use(function (req, res, next) {
    if (req.cookies['xid']) {
        auth.user(req.cookies['xid'], function (err, user) {
            if (!err) {
                req.user = user;
                next();
            } else {
                res.sendStatus(401);
            }
        });
    } else {
        res.sendStatus(401);
    }
});

app.use('/user', usersRouter);
app.use('/audience', audienceRouter);
app.use('/campaign', campaignRouter);
app.use('/scheduler', jobsRouter);

app.use(function (req, res, next) {
    res.status(404).send('Route Not Found');
});

app.use((err, req, res) => {
    res.publish(false, err.message, null);
});

process.on('SIGINT', function() {
    redisClient.quit();
    console.log('redis client quit');
    // process.exit();
});

process.on("exit", function(){
    redisClient.quit();
    console.log('redis client quit');
    // process.exit();
});

module.exports = app;
