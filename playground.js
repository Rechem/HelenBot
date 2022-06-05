// const {getLocalDate} = require('./utils')
// console.log(getLocalDate().toISOString())
// const axios = require('axios');
var axios = require("axios").default;
const cheerio = require('cheerio');
require('dotenv').config()
// var options = {
//   method: 'GET',
//   url: 'https://scrapers-proxy2.p.rapidapi.com/standard',
//   params: {url: 'https://marw.dz', country: 'fr'},
//   headers: {
//     'x-rapidapi-host': 'scrapers-proxy2.p.rapidapi.com',
//     'x-rapidapi-key': '3e4750d678mshb53ded449ba2c17p165fa7jsnde2dd911fb24'
//   }
// };
;
(async () => {

    const response = await axios.get('https://www.sntf.dz/')

    const $ = cheerio.load(response.data)
    let data = $('.select2-results__option').html()
    // date = data.substring(data.indexOf(' ') + 1 , data.indexOf('هـ') + 2)
    console.log(data)
})()