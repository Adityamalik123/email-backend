const config = require('../../config.js');
const {codeFromJobStatus, nextExecution} = require('../../utils/utils');
const {checkCronValidity} = require('../../models/jobs');
const {scheduleCampaign, updateCampaign, createCampaign} = require('../../utils/sendgrid');

const run = async (job) => {
    const resp = await createCampaign(job.name);
    let payload = {
        ...job.payload,
        sgCampaignId: resp.data.id
    };
    job.update({payload});
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
    let executionTime = nextExecution(job.schedule, job.timezone, job.executionTime);
    let status = codeFromJobStatus('COMPLETED');
    if (job.schedule !== '@once') {
        executionTime = checkCronValidity(job.options, executionTime) ? null : executionTime;
        if (executionTime !== null) {
            status = codeFromJobStatus('PENDING-SG');
        }
    }
    job.update({
        checkpoint: 'NONE',
        lastExecutionTime: job.nextExecutionTime,
        nextExecutionTime: executionTime,
        status,
        executionTime,
        nextExecution,
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
