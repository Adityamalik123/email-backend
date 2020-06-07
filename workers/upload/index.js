const moment = require('moment');
const _ = require('lodash');
const {getData} = require('../../models/audience');
const {codeFromJobStatus} = require('../../utils/utils');
const {addUpdateContacts, contactUploadStatus} = require('../../utils/sendgrid');

async function validateUploadStatus (job) {
    if (!job.payload.job_id) {
        return true;
    }
    const res = await contactUploadStatus(job.payload.job_id);
    return res.data.status !== 'pending';
}

const run = async (job) => {
    let payload = job.payload;
    const flag = await validateUploadStatus(job);
    if (flag) {
        let prevId = job.checkpoint !== 'NONE' ? job.checkpoint : undefined;
        const data = await getData(payload.userId, payload.audienceId, prevId, 500);
        if (data && data.length > 0) {
            let len = data.length;
            const contacts = _.map(data, (i) => {
                return {
                    email: i.email,
                    first_name: i.name
                }
            });
            await addUpdateContacts({list_ids:[payload.listId], contacts}).then((res) => {
                payload = {...payload, ...res.data};
                job.update({
                    payload
                })
            }).catch((e) => {
                console.log(JSON.stringify(e), 'Contacts API Issue SG');
            });
            prevId = data[len - 1]._id.toString();
            updateCheckPoint(job, prevId);
        } else {
            updateCheckPoint(job, undefined);
        }
    } else {
        updateCheckPoint(job, job.checkpoint);
    }
};

function nextCycle () {
    return moment().add(5, 'seconds').toString();
}

const updateCheckPoint = (job, id) => {
    const nextExecutionTime = id ? nextCycle() : job.executionTime;
    const status = id ? codeFromJobStatus('PENDING-UPLOAD') : codeFromJobStatus('PENDING-SG');
    job.update({
        checkpoint: id || 'NONE',
        lastExecutionTime: job.nextExecutionTime,
        status,
        nextExecutionTime,
        executionCount: job.executionCount + 1
    });
    console.log('Updated Checkpoint (Email)');
};

const errorHandler = (job, e) => {
    console.log(JSON.stringify(e), `Got error in the job + ${job.name}`);
};

module.exports = {
    errorHandler,
    updateCheckPoint,
    run
};
