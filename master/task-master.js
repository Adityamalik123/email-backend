const {updateAndGetToBeScheduledJob, updateAndGetToBeUploadedJob} = require('../models/jobs');
const {timedPromise, codeFromJobStatus} = require('../utils/utils');
const emailNotification = require('../workers/email');
const upload = require('../workers/upload');

async function jobHandlerUpload (job) {
    console.log('Job Received - Upload');
    await job.update({
        status: codeFromJobStatus('SCHEDULED-UPLOAD')
    });
    let jobExecutor = upload;
    try {
        await jobExecutor.run(job);
    } catch (e) {
        console.log('UPLOAD JOB FAILED');
        jobExecutor.errorHandler(job, e);
        await job.update({status: codeFromJobStatus('FAILED')});
    }
}

async function jobHandlerSG (job) {
    console.log('Job Received - SendGrid');
    await job.update({
        status: codeFromJobStatus('SCHEDULED-SG')
    });
    let jobExecutor = emailNotification;
    try {
        await jobExecutor.run(job);
    } catch (e) {
        console.log('SG JOB FAILED');
        jobExecutor.errorHandler(job, e);
        await job.update({status: codeFromJobStatus('FAILED')});
    }
}

// TODO - Write reconciliation function

async function startMasterUpload () {
    try {
        while (1) {
            const job = await updateAndGetToBeUploadedJob();
            if (!job) {
                await timedPromise(1000);
            } else {
                await jobHandlerUpload(job);
            }
        }
    } catch (e) {
        console.log(e);
        startMasterUpload();
    }
}

async function startMasterSG () {
    try {
        while (1) {
            const jobs = await updateAndGetToBeScheduledJob();
            if (!jobs || jobs.length < 1) {
                await timedPromise(1000);
            } else {
                await jobHandlerSG(jobs);
            }
        }
    } catch (e) {
        console.log(e);
        startMasterSG();
    }
}

module.exports = {
    startMasterUpload,
    startMasterSG
};
