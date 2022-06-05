const { getLocalDate } = require('./utils')
const { getTrainTime, getWeatherForecast, getHijriDate, getPokeCount, incPokeCount } = require('./model')

const stations = {
    "alger": { id: 69, name: "Alger" },
    "agha": { id: 37, name: "Alger(Agha)" },
    "ateliers": { id: 75, name: "Les ateliers" },
    "husseindey": { id: 237, name: "Hussein Dey" },
    "caroubier": { id: 141, name: "Caroubier" },
    "elharrach": { id: 185, name: "El Harrach" },
    "ouedsmar": { id: 320, name: "Oued Smar" },
    "babezzouar": { id: 83, name: "Bab Ezzouar" },
    "darelbeida": { id: 155, name: "Dar El Beida" },
    "roubia": { id: 353, name: "Rouiba" },
    "rouibaindustrielle": { id: 438, name: "Rouiba Industrielle" },
    "reghaiaindustrielle": { id: 439, name: "Reghaia Industrielle" },
    "reghaia": { id: 348, name: "Reghaia" },
    "boudouaou": { id: 121, name: "Boudouaou" },
    "corso": { id: 149, name: "Corso" },
    "boumerdes": { id: 134, name: "Boumerdes" },
    "tidjelabine": { id: 417, name: "Tidjelabine" },
    "thenia": { id: 415, name: "Thenia" },
    "airport": { id: 560, name: "Aéroport Houari Boumediene" },
    "guedeconstantine": { id: 218, name: "Gué de Constantine" },
    "ainnaadja": { id: 49, name: "Ain Naadja" },
    "babaali": { id: 122, name: "Baba Ali" },
    "tessalaelmerdja": { id: 524, name: "Tessala El Merdja" },
    "sidiabdellah": { id: 525, name: "Sidi Abdellah" },
    "sidiabdellahu": { id: 528, name: "Sidi Abdellah Université" },
    "zeralda": { id: 527, name: "Zeralda" },
    "boufarik": { id: 122, name: "Boufarik" },
    "benimered": { id: 96, name: "Beni Mered" },
    "blida": { id: 144, name: "Blida" },
    "chiffa": { id: 145, name: "Chiffa" },
    "mouzaia": { id: 293, name: "Mouzaia" },
    "elaffroun": { id: 168, name: "El Affroun" },
    "simustapha": { id: 378, name: "Si Mustapha" },
    "issers": { id: 240, name: "Les Issers" },
    "bordjmenaiel": { id: 80, name: "Bordj Menaiel" },
    "naceria": { id: 298, name: "Naceria" },
    "tadmait": { id: 401, name: "Tadmait" },
    "draabenkhedda": { id: 150, name: "Draa Ben Khedda" },
    "boukhalfa": { id: 129, name: "Boukhalfa" },
    "tiziouzou": { id: 423, name: "Tizi Ouzou" },
    "kefnaaja": { id: 445, name: "Kef Naaja" },
    "ouedaissiu": { id: 530, name: "Oued Aissi Université" },
    "ouedaissi": { id: 446, name: "Oued Aissi" },
}
const algiersStation = "alger"
const ouedsmarStation = "ouedsmar"

const offDays = {
    gregorian: [
        '01-01',
        '01-12',
        '05-01',
        '07-05',
        '11-08',
    ],
    hijri: [
        '01-محرم',
        '10-محرم',
        '12-ربيع الأول',
        '01-شوال',
        '02-شوال',
        '01-ذو الحجة',
        '02-ذو الحجة',
    ]
}

const trainTimeHandler = async (msg) => {

    const today = getLocalDate()

    let msgCopy = msg
    let showArg = msgCopy.match(/(?<=\bshow\b\s+)([0-99])$/g)
    showArg = parseInt(showArg) || 2

    msgCopy = msgCopy.replace(/(\bshow\b\s+[0-99])?$/g, '').trim()

    let timeArg = msgCopy.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/g)
    if (!timeArg || timeArg === '') {
        const currentHours = ("0" + today.getUTCHours()).slice(-2);
        const currentMinutes = ("0" + today.getUTCMinutes()).slice(-2);
        timeArg = currentHours + ':' + currentMinutes
    }

    msgCopy = msgCopy.replace(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/g, '').trim()

    let stationsStr = msgCopy.match(/(\s+[a-z]+\s+[a-z]+)$/g)

    let departure, arrival, departureStr, arrivalStr;
    if (!stationsStr || stationsStr === '') {

        if (parseInt(timeArg) >= 12) {
            departureStr = ouedsmarStation
            arrivalStr = algiersStation
        } else {
            departureStr = algiersStation
            arrivalStr = ouedsmarStation
        }
    } else {
        stationsStr = stationsStr.toString().trim()
        departureStr = stationsStr.split(' ')[0]
        arrivalStr = stationsStr.split(' ')[1]
    }
    try {
        departure = stations[departureStr].id;
        arrival = stations[arrivalStr].id
    } catch (e) {
        throw new Error("Station Unknown")
    }

    const listOfTrains = await getTrainTime(departure, arrival, timeArg, showArg)

    return {
        departure: stations[departureStr].name,
        arrival: stations[arrivalStr].name,
        time: timeArg,
        listOfTrains: listOfTrains.timeList,
        previous: listOfTrains.previous
    }
}



const weatherHandler = async (msg) => {

    const arrows = {
        upper_right: "\u2197\ufe0f",
        lower_right: "\u2198\ufe0f",
        lower_left: "\u2199\ufe0f",
        upper_left: "\u2196\ufe0f",
        up: "\u2b06\ufe0f",
        down: "\u2b07\ufe0f",
        right: "\u27a1\ufe0f",
        left: "\u2b05\ufe0f",
    }

    let msgCopy = msg
    let locationArg = msgCopy.match(/(?<=\bhelen weather\b\s*)[ a-z]*/g).join(' ').trim()
    let weatherData
    if (!locationArg || locationArg === '') {
        weatherData = await getWeatherForecast()
    } else {
        weatherData = await getWeatherForecast(locationArg)
    }
    if (weatherData.windDegree <= 157) {
        if (weatherData.windDegree <= 67) {
            if (weatherData.windDegree <= 22) {
                //up
                weatherData.windDegree = arrows.down
            } else {
                //up right
                weatherData.windDegree = arrows.lower_left
            }
        } else {
            if (weatherData.windDegree <= 112) {
                //right
                weatherData.windDegree = arrows.left
            } else {
                //down right
                weatherData.windDegree = arrows.upper_left
            }
        }
        //>= 158
    } else {
        if (weatherData.windDegree <= 247) {
            if (weatherData.windDegree <= 202) {
                //down
                weatherData.windDegree = arrows.up
            } else {
                //down left
                weatherData.windDegree = arrows.upper_right
            }
            //>= 248
        } else {
            if (weatherData.windDegree <= 337) {
                if (weatherData.windDegree <= 292) {
                    //left
                    weatherData.windDegree = arrows.right
                } else {
                    //up left
                    weatherData.windDegree = arrows.lower_right
                }
            } else {
                //up
                weatherData.windDegree = arrows.down
            }
        }
    }
    return weatherData;
}

const isOffDay = async (date, { hijriDateArg }) => {

    if (date.getDay() === 5) {
        return true
    } else {
        gregorianDate = date.toISOString().slice(5, 10)
        offDays.gregorian.forEach((element) => {
            if (element === gregorianDate)
                return true
        })

        let hijriDate;
        if (hijriDateArg) {
            hijriDate = hijriDateArg
        } else {
            hijriDate = await getHijriDate()
        }
        day = parseInt(hijriDate.substring(0, hijriDate.indexOf(' ')).trim())
        month = hijriDate.substring(hijriDate.indexOf(' ') + 1, hijriDate.length - 5).trim()
        hijriDate = day + '-' + month
        offDays.hijri.forEach((element) => {
            if (hijriDate === element) {
                return true
            }
        })
        return false
    }
}

const pokeBot = async () => {
    await incPokeCount(1);
    const count = await getPokeCount();
    return count;
}

module.exports = { trainTimeHandler, weatherHandler, isOffDay, pokeBot }