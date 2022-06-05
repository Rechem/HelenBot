const getLocalDate = () => {
    const utcOffset = 1;
    const serversDate = new Date();
    const todaysDate =  Date.UTC(serversDate.getUTCFullYear(), serversDate.getUTCMonth(), serversDate.getUTCDate(),
    serversDate.getUTCHours() + utcOffset, serversDate.getUTCMinutes(), serversDate.getUTCSeconds());
    return new Date(todaysDate);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {getLocalDate, delay}