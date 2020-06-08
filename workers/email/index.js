const config = require('../../config.js');
const {codeFromJobStatus, nextExecution} = require('../../utils/utils');
const {scheduleCampaign, updateCampaign} = require('../../utils/sendgrid');

const run = async (job) => {
    let payload = job.payload;
    const encodedEmailData = encodeURIComponent(Buffer.from(JSON.stringify({
        listId: payload.listId,
        sgCampaignId: payload.sgCampaignId,
        audienceId: payload.audienceId,
        campaignId: job.name,
        userId: payload.userId
    })).toString('base64'));
    payload.content = payload.content.concat(`<br/><a href="{{{unsubscribe}}}">Click here to unsubscribe.</a>`);
    const data = {
        "send_to": {
            "list_ids": [payload.listId]
        },
        "email_config": {
            "subject": payload.subject,
            "html_content": payload.content,
            "custom_unsubscribe_url": `${config.scheme}://${config.HOST}/api/backend/unsubscribe/${encodedEmailData}?email={{email}}`,
            "sender_id": 861360
        }
    };
    await updateCampaign(payload.sgCampaignId, data);
    await scheduleCampaign(payload.sgCampaignId, {"send_at": "now"});
    updateCheckPoint(job)
};

const updateCheckPoint = (job) => {
    const executionTime = nextExecution(job.schedule, job.timezone, job.executionTime);
    const status = job.schedule === '@once' ? codeFromJobStatus('COMPLETED') : codeFromJobStatus('PENDING-SG');
    job.update({
        checkpoint: 'NONE',
        lastExecutionTime: job.nextExecutionTime,
        status,
        executionTime,
        executionCount: job.executionCount + 1
    });
    console.log('Updated Checkpoint (Email)');
};

const errorHandler = (job, e) => {
    console.log(JSON.stringify(e), `Got error in the job - ${job.name}`);
};

module.exports = {
    errorHandler,
    updateCheckPoint,
    run
};
