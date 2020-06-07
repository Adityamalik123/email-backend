const csv = require('csv-parser');
const request = require('request');
const {bulkRecordPush} = require('../models/audience');
let results = [];
let count = 0;

function pushToTable (userId, url, audienceId) {
    const parser = csv({
        mapHeaders: ({ header, index }) => header.toLowerCase()
    });
    // Could have used fs.readFile function - writing code considering CDN link
    request(url).pipe(parser)
        .on('data', async (data) => {
            if (results.length === 1000) {
                try {
                    parser.pause();
                    await bulkRecordPush(results);
                    count = count + 1000;
                    console.log(`${count} written`);
                } catch (e) {
                    console.log(e);
                }
                parser.resume();
                results = [];
            }
            data.inserted = new Date();
            data.audienceId = audienceId;
            data.userId = userId;
            results.push(data);
        })
        .on('end', () => {
            if (results.length > 0) {
                bulkRecordPush(results);
                count = count + results.length;
                console.log(`${count} written`);
                results = [];
                count = 0;
            }
        }).on('error', (e) => {
        console.log(e);
    });
}

module.exports = {
    pushToTable
};
