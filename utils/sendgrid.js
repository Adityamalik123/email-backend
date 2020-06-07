const axios = require('axios');
const instance = axios.create({
    baseURL: 'https://api.sendgrid.com/v3/marketing/'
});

const headers = {
    Authorization: 'Basic YWRpdHlhQHdlc3ByaW5rLmNvbTpQYXBhcGFwYUAxMjM=',
    'Content-Type': 'application/json'
};

const createList = (name) => {
    return instance.post('/lists', {"name": name}, {headers})
};

const createCampaign = (name) => {
    return instance.post('/singlesends', {"name": name}, {headers})
};

const updateCampaign = (id, body) => {
    return instance.patch(`/singlesends/${id}`, body, {headers})
};

const scheduleCampaign = (id, body) => {
    return instance.put(`/singlesends/${id}/schedule`, body, {headers})
};

const addUpdateContacts = (body) => {
    return instance.put('/contacts', body, {headers})
};

const contactUploadStatus = (id) => {
    return instance.get(`/contacts/imports/${id}`, {headers})
};

module.exports = {
    createList,
    createCampaign,
    updateCampaign,
    scheduleCampaign,
    addUpdateContacts,
    contactUploadStatus
};
