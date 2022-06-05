const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const { getLocalDate } = require('./utils')
require('dotenv').config();

const getTrainTime = async (gd, ga, argTime, amount = 2) => {
    const todaysDate = getLocalDate()
    if (argTime) {
        try {
            const time = argTime.toString().split(':')
            const hh = parseInt(time[0])
            const mm = parseInt(time[1])
            todaysDate.setHours(hh, mm, 0);
        } catch (e) {
            console.log(e)
        }
    }
    const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    const isOffDay = config.isOffDay
    const date = new Date(config.todaysDate)
    dateParameter = date.toISOString().slice(0, 10).replace(/-/g, "");
    const url = "https://www.sntf.dz/index.php/component/sntf/?gd=" + gd + "&ga=" + ga + "&dd=" + dateParameter + "&h1=0000&h2=2359&view=train"

    const currentHours = ("0" + todaysDate.getHours()).slice(-2);
    const currentMinutes = ("0" + todaysDate.getMinutes()).slice(-2);

    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const scrapList = $('table.sntf_trajet.hidden-xs')
    let trainTimes = {
        timeList: [],
        previous: undefined,
    }
    let previousSelected = false
    let counter = 0;

    scrapList.each((index, element) => {
        if (isEligibleTrain($(element), isOffDay)) {
            const departureTime = $(element).find('td:nth-child(4)').html().replace(/\s\s+/g, '');
            const arrivalTime = $(element).find('td:nth-child(6)').html().replace(/\s\s+/g, '');

            if ((departureTime + ':00') >= (currentHours + ':' + currentMinutes + ':00')) {
                if (counter < amount) {
                    trainTimes.timeList.push({
                        departure: departureTime,
                        arrival: arrivalTime
                    })
                    counter++;
                }
                if (!previousSelected) {
                    const { departurePrev, arrivalPrev } = getPreviousEligibleTrain(scrapList, index, isOffDay, $)
                    if (departurePrev && arrivalPrev)
                        trainTimes.previous = {
                            departure: departurePrev,
                            arrival: arrivalPrev
                        }
                    previousSelected = true
                }
            } else if ((index + 1) === scrapList.length && trainTimes.timeList.length === 0) {
                const { departurePrev, arrivalPrev } = getPreviousEligibleTrain(scrapList, index, isOffDay, $)
                if (departurePrev && arrivalPrev)
                    trainTimes.previous = {
                        departure: departurePrev,
                        arrival: arrivalPrev
                    }
            }
        }
    });

    return trainTimes

}

const getPreviousEligibleTrain = (scrapList, currentIndex, isOffDay, $) => {
    let stepIndex = 1
    while (currentIndex - stepIndex >= 0) {
        let train = $($(scrapList)[currentIndex - stepIndex])
        if (isEligibleTrain(train, isOffDay)) {
            const departurePrev = train.find('td:nth-child(4)').html().replace(/\s\s+/g, '');
            const arrivalPrev = train.find('td:nth-child(6)').html().replace(/\s\s+/g, '');
            return { departurePrev, arrivalPrev}
        } else {
            stepIndex++
        }
    }
    return {departurePrev: undefined, arrivalPrev: undefined}
}

const isEligibleTrain = (element, isOffDay) => {
    const code = element.find('code').text().trim()
    return ((!isOffDay && 'Ne circule pas les vendredis et jours fériés' === code)
        || (isOffDay && 'Circule seulement les vendredis et jours fériés' === code)
        || ('Circule tous les jours' === code))
}

const getHijriDate = async () => {

    const response = await axios.get('http://ferkous.com/home/?q=ar')
    const $ = cheerio.load(response.data)
    let data = $('#date > span:nth-child(1)').text().replace(/\s+/gm, " ").trim();
    date = data.substring(data.indexOf(' ') + 1, data.indexOf('هـ') + 2)

    return date
}

const getWeatherForecast = async (location = "algiers") => {
    const apiKey = process.env.WEATHER_API_KEY
    const url = 'http://api.weatherapi.com/v1/forecast.json?key=' + apiKey + '&q=' + location
        + '&days=1&aqi=no&alerts=no'

    const { data } = await axios.get(url)
    const returnObject = {
        location: data.location.name + ', ' + data.location.country,
        lastUpdated: data.current.last_updated,
        condition: data.current.condition.text,
        icon: data.current.condition.icon.
            substring(data.current.condition.icon.indexOf('/64x64/')
                , data.current.condition.icon.length),
        temperatue: data.current.temp_c,
        humidity: data.current.humidity,
        minTemp: data.forecast.forecastday[0].day.mintemp_c,
        maxTemp: data.forecast.forecastday[0].day.maxtemp_c,
        chaineOfRain: data.forecast.forecastday[0].day.daily_chance_of_rain,
        windKph : data.current.wind_kph,
        windDegree : data.current.wind_degree,
        windKphMax : data.forecast.forecastday[0].day.maxwind_kph,
    }

    return returnObject
}

const getPokeCount = async () => {
    const dataApiId = process.env.DATA_API_ID
    const url = 'https://data.mongodb-api.com/app/' + dataApiId + '/endpoint/data/beta/action/findOne'
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.MONGODB_API_KEY,
        }
    }
    const data = {
        dataSource: "Cluster0",
        database: "messngerBot",
        collection: "bot-info",
        filter: {
            name: "Stats"
        },
        projection: {
            "stats.pokeCount": 1
        }
    }
    const a = await axios.post(url, data, config)
    return a.data.document.stats.pokeCount

}

const incPokeCount = async (amount = 1) => {
    const dataApiId = process.env.DATA_API_ID
    const url = 'https://data.mongodb-api.com/app/' + dataApiId + '/endpoint/data/beta/action/updateOne'
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.MONGODB_API_KEY,
        }
    }
    const data = {
        dataSource: "Cluster0",
        database: "messngerBot",
        collection: "bot-info",
        filter: {
            name: "Stats"
        },
        update: {
            "$inc": {
                "stats.pokeCount": amount
            },
        },
        upsert: true,
    }

    await axios.post(url, data, config)

}

const getCovidStats = async () => {

    const response = await axios.get("https://www.worldometers.info/coronavirus/country/algeria")
    const $ = cheerio.load(response.data)

    let lastUpdated = $('#news_block > .news_date > h4').text()
    lastUpdated = lastUpdated.substring(0, lastUpdated.length - 6)
    let text = $($('li[class=news_li]')[0]).text()
    text = text.replace(/\s*\[\bsource\b\]$/g, '')
    text = text.replace(/(?<=[1-9]+),(?=[0-9]+)/g, '')
    return {
        lastUpdated,
        text
    }
}

module.exports = {
    getTrainTime,
    getHijriDate,
    getWeatherForecast,
    getPokeCount,
    incPokeCount,
    getCovidStats,
}
