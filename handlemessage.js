const { getHijriDate, getCovidStats } = require('./model')
const { weatherHandler, trainTimeHandler, pokeBot } = require('./controller')

const fs = require('fs')

const emojiMap = JSON.parse(fs.readFileSync('emoji_map.json', 'utf-8'))

const trainList = [
    "steam_locomotive",
    "railway_car",
    "bullettrain_side",
    "bullettrain_front",
    "train2",
    "metro",
    "monorail",
    "light_rail",
    "station",
    "tram",
    "train",
];

const handleTriggerMessage = async (api, message) => {
    if (message) {
        trimmedMsg = message.body.toLowerCase().trim()
        const trainRegEx = new RegExp(/^\bhelen\b\s+\btrain\b(\s+[a-z]+\s+[a-z]+)?(\s+([0-1]?[0-9]|2[0-3]):[0-5][0-9])?(\s+\bshow\b\s+[1-9]{1})?$/g)
        const weatherRegEx = new RegExp(/^\bhelen\b\s+\bweather\b[\s+a-z]*$/g)
        const hijriDateRegEx = new RegExp(/^\bhelen\b\s+\bhijri\b$/g)
        const pokeRegEx = new RegExp(/^\bhelen\b\s+\bpoke\b$/g)
        const helpRegEx = new RegExp(/^\bhelen\b\s+\bhelp\b$/g)
        const covidRegEx = new RegExp(/^\bhelen\b\s+\bcovid\b$/g)
        const dieRegEx = new RegExp(/^\bhelen\b\s+\bdie\b$/g)

        if (trainRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap[trainList[Math.floor(Math.random() * (trainList.length - 1))]],
                message.messageID);
            try {
                const trainsObject = await trainTimeHandler(trimmedMsg)
                let returnString;
                if (trainsObject.listOfTrains.length === 0) {
                    returnString = "It seems there is no train at that/the moment...\n"
                } else {
                    returnString = "Trains going from " + trainsObject.departure + " to "
                        + trainsObject.arrival + " at +" + trainsObject.time + " :\n\n"
                    trainsObject.listOfTrains.forEach(element => {
                        returnString += "Departure: " + element.departure + " | Arrival: " + element.arrival + "\n";
                    });
                }

                if(trainsObject.previous){
                    returnString += "\nPrevious train:\n" +
                    "Departure: " + trainsObject.previous.departure + " | Arrival: " + trainsObject.previous.arrival;
                }
                api.sendMessage(returnString, message.threadID);
                
            } catch (e) {
                if (e.message === "Station Unknown") {
                    api.sendMessage("I dont know that station, type the full name of a station without any space.", message.threadID);
                } else {
                    console.log(e)
                    api.sendMessage("There was an error fetching train data :c", message.threadID);
                }
            }
        } else if (weatherRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap.white_sun_behind_cloud, message.messageID);
            try {

                const weatherForecast = await weatherHandler(trimmedMsg)
                let returnString = 'Weather forecast for ' + weatherForecast.location + ':\n'
                    + weatherForecast.condition + ', ' + weatherForecast.temperatue + '° '
                    + '(' + weatherForecast.minTemp + '°/' + weatherForecast.maxTemp + '°)\n'
                    + 'Humidity: ' + weatherForecast.humidity + '%\n'
                    + 'Chance of rain: ' + weatherForecast.chaineOfRain + '%\n'
                    + 'Wind : ' + weatherForecast.windKph + 'kmh ' + weatherForecast.windDegree + ' (max '
                    + weatherForecast.windKphMax + 'kmh)\n'
                    + 'Last updated: '
                    + weatherForecast.lastUpdated.substring(weatherForecast.lastUpdated.indexOf(' ') + 1, weatherForecast.lastUpdated.length)
                api.sendMessage(returnString, message.threadID);
            } catch (e) {
                console.log(e)
                api.sendMessage("There was an error fetching weather data :c", message.threadID);
            }
        } else if (hijriDateRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap.crescent_moon, message.messageID)
            try {
                // get hijri date from config try catch
                const configFile = fs.readFileSync('config.json', 'utf-8')
                const config = JSON.parse(configFile)
                api.sendMessage(config.hijriDate, message.threadID);
            } catch (e) {
                console.log(e)
                api.sendMessage("There was an error fetching Hijri data :c", message.threadID)
            }

        } else if (helpRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap.thumbsup, message.messageID)
            try {
                const { helpMessage } = JSON.parse(fs.readFileSync('helpMessage.json', 'utf-8'))
                api.sendMessage(helpMessage, message.threadID)
            } catch (e) {
                console.log(e)
                api.sendMessage("Help not available at the moment :c", message.threadID)
            }

        } else if (pokeRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap.space_invader, message.messageID)
            try {
                const count = await pokeBot();
                const returnString = "Helen has been poked " + count + " times !"
                api.sendMessage(returnString, message.threadID)
            } catch (e) {
                api.sendMessage("There was an error poking Helen :c", message.threadID)
            }

        } else if (covidRegEx.test(trimmedMsg)) {

            api.setMessageReaction(emojiMap.mask, message.messageID)
            try {
                const returnObject = await getCovidStats()
                let returnString;
                returnString = returnObject.text + '\nLast updated: ' + returnObject.lastUpdated
                api.sendMessage(returnString, message.threadID)
            } catch (e) {
                api.sendMessage("There was an error fetching covid-19 information :c", message.threadID)
            }

        } else if (dieRegEx.test(trimmedMsg)){
            api.setMessageReaction(emojiMap.thumbsdown, message.messageID);
            api.sendMessage("u die >.>", message.threadID)
        }else{

            api.setMessageReaction(emojiMap.question, message.messageID);
            api.sendMessage("Sorry, what do you mean ?\ntype: \'helen help\' for a list of available commands",
                message.threadID)
        }
    }
}

module.exports = { handleTriggerMessage }