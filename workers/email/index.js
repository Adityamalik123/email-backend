const {codeFromJobStatus, nextExecution} = require('../../utils/utils');
const {scheduleCampaign, updateCampaign} = require('../../utils/sendgrid');

const run = async (job) => {
    let payload = job.payload;
    const data = {
        "send_to": {
            "list_ids": [payload.listId]
        },
        "email_config": {
            "subject": payload.subject,
            "html_content": payload.content,
            "custom_unsubscribe_url": "http://test.com",
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
