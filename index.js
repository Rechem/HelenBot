const login = require("facebook-chat-api");
const fs = require("fs")
const schedule = require('node-schedule');
const { isOffDay } = require('./controller')
const { handleTriggerMessage } = require('./handlemessage');
const { getHijriDate } = require("./model");
const { getLocalDate, delay } = require('./utils')
require('./server')

const credentials = { appState: JSON.parse(fs.readFileSync('appState.json', 'utf-8')) }

let config;
//init
(async () => {
    
    try {
        const configFile = fs.readFileSync('config.json', 'utf-8')
        config = JSON.parse(configFile)
    } catch (e) {
        config = {}
    }
    const todaysDate = getLocalDate()
    config.todaysDate = todaysDate
    let count = 0
    let loop = true
    while (loop) {
        try {
            config.hijriDate = await getHijriDate()
            config.isOffDay = await isOffDay(todaysDate, {hijriDateArg : config.hijriDate})
            console.log('Off Day fetched')
            loop = false
        } catch (e) {
            await delay(5000)
            // console.log(e)
            console.log('Failed to fetch offDay, trying again...');
            count++
            if(count === 10)
                process.exit()
        }
    }

    fs.writeFileSync('config.json', JSON.stringify(config))
})()

const rule = new schedule.RecurrenceRule();
rule.hour = 3;
rule.minute = 0;
rule.tz = 'Africa/Algiers'

schedule.scheduleJob(rule, async () => {
    const todaysDate = getLocalDate()
    config.todaysDate = todaysDate

    let count = 0
    let loop = true
    while (loop) {
        try{
            config.hijriDate = await getHijriDate()
            config.isOffDay = await isOffDay(todaysDate, {hijriDateArg : config.hijriDate})
            console.log('offDay fetched')
            loop = false
        } catch (e) {
            await delay(5000)
            console.log(e)
            console.log('Failed to fetch offDay, trying again...');
            count++
            if(count === 10)
                process.exit()
        }
    }
    fs.writeFileSync('config.json', JSON.stringify(config))
    console.log("Date updated")
})

login(credentials, (err, api) => {
    if (err) {
        console.error(err);
        process.exit()
    }

    api.listenMqtt(async (err, message) => {
        fs.writeFileSync(
			'appState.json',
			JSON.stringify(api.getAppState(), null, 4)
		);
		if (err) return log.error('Listen Api error!', err);
        if (message.body) {
            if (message.body.includes("69"))
                api.sendMessage("nice", message.threadID);
            if (new RegExp(/^\bhelen\b\s+[a-z]+/g).test(message.body.toLowerCase())) {
                api.markAsRead(message.threadID)
                await handleTriggerMessage(api, message)
            }
        }
    });
});