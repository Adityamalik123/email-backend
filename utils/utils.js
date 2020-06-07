const parser = require('cron-parser');
const moment = require('moment');
require('moment-timezone');

function isString (s) {
    return typeof (s) === 'string' || s instanceof String;
}

const isValidSchedule = (schedule) => {
    if (schedule === '@once') {
        return true;
    }
    return parser.parseExpression(schedule);
};
const nextExecution = (schedule, tz = 'Etc/GMT', executionTime = undefined) => {
    if (schedule === '@once') {
        return executionTime;
    }
    return parser.parseExpression(schedule, {tz}).next().toISOString();
};
const isValidTimezone = (tz) => {
    if (!isString(tz) || !moment.tz.zone(tz)) {
        throw new Error('Invalid TimeZone');
    }
};

const jobStatusFromCode = (code) => {
    switch (code) {
        case 0:
            return 'PENDING-UPLOAD';
        case 1:
            return 'ASSIGNED-UPLOAD';
        case 2:
            return 'SCHEDULED-UPLOAD';
        case 3:
            return 'PENDING-SG';
        case 4:
            return 'ASSIGNED-SG';
        case 5:
            return 'SCHEDULED-SG';
        case 6:
            return 'COMPLETED';
        case 7:
            return 'FAILED';
        case 8:
            return 'PAUSED';
        default:
            return 9;
    }
};

const codeFromJobStatus = (status) => {
    switch (status) {
        case 'PENDING-UPLOAD':
            return 0;
        case 'ASSIGNED-UPLOAD':
            return 1;
        case 'SCHEDULED-UPLOAD':
            return 2;
        case 'PENDING-SG':
            return 3;
        case 'ASSIGNED-SG':
            return 4;
        case 'SCHEDULED-SG':
            return 5;
        case 'COMPLETED':
            return 6;
        case 'FAILED':
            return 7;
        case 'PAUSED':
            return 8;
        default:
            return 9;
    }
};

const timedPromise = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = {
    isValidSchedule,
    nextExecution,
    isValidTimezone,
    jobStatusFromCode,
    codeFromJobStatus,
    timedPromise,
    isString
};
