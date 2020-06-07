const db = require('../db/mysql');
const Sequelize = require('sequelize');
const moment = require('moment');
require('moment-timezone');
const { isValidSchedule, isValidTimezone, nextExecution, codeFromJobStatus} = require('../utils/utils');
const config = require('../config.js');

let Job = db.define('jobs', {
    id: {

        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: true
        }
    },
    displayName: Sequelize.STRING,
    schedule: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: true,
            isValidSchedule
        }
    },
    timezone: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isValidTimezone
        }
    },
    userId: {
        allowNull: false,
        validate: {
            notNull: true
        },
        type: Sequelize.STRING
    },
    executionCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    lastExecutionTime: {
        type: Sequelize.DATE
    },
    nextExecutionTime: {
        type: Sequelize.DATE
    },
    executionTime: {
        type: Sequelize.DATE
    },
    payload: {
        type: Sequelize.JSON,
        allowNull: false,
        validate: {
            notNull: true
        }
    },
    options: Sequelize.JSON,
    node: {
        type: Sequelize.STRING,
        defaultValue: 'NONE'
    },
    checkpoint: {
        type: Sequelize.STRING,
        defaultValue: 'NONE'
    },
    status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
}, {
    freezeTableName: true,
    timestamps: true
});

// Job.sync().then(() => {
//     // put your user create code inside this
// });

function checkCronValidity (options, nextExecutionTime) {
    return options && options.cronExpirationTime && moment(options.cronExpirationTime) <= moment(nextExecutionTime);
}

function getExecutionTime (data) {
    const executionTime = nextExecution(data.schedule, data.timezone, data.executionTime);
    data.executionTime = checkCronValidity(data.options, executionTime) ? null : executionTime;
    if (data.executionTime === null) {
        data.status = 4;
    }
}

const getAllJobsByUserId = (userId) => {
    return Job.findAll({where: {userId}});
};

const addJob = (data) => {
    getExecutionTime(data);
    data.nextExecutionTime = moment().toString();
    return Job.create(data);
};

const updateAndGetToBeScheduledJob = () => {
    const query = `
        UPDATE jobs SET status = ${codeFromJobStatus('ASSIGNED-SG')} , node = "${config.name}"
        WHERE executionTime < "${moment().toISOString()}" AND  status = ${codeFromJobStatus('PENDING-SG')}
        ORDER BY executionTime LIMIT 1`;
    return db.query(query).then(() => {
        return Job.findOne({
            where: {
                node: config.name,
                status: codeFromJobStatus('ASSIGNED-SG')
            }
        });
    });
};

const updateAndGetToBeUploadedJob = () => {
    const query = `
        UPDATE jobs SET status = ${codeFromJobStatus('ASSIGNED-UPLOAD')} , node = "${config.name}"
        WHERE nextExecutionTime < "${moment().toISOString()}" AND status = ${codeFromJobStatus('PENDING-UPLOAD')}
        ORDER BY executionTime LIMIT 1`;
    return db.query(query).then(() => {
        return Job.findOne({
            where: {
                node: config.name,
                status: codeFromJobStatus('ASSIGNED-UPLOAD')
            }
        })
    });
};

module.exports = {
    addJob,
    updateAndGetToBeScheduledJob,
    updateAndGetToBeUploadedJob,
    getAllJobsByUserId
};
