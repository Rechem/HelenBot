const express = require('express')
const app = express();

app.set("port", (process.env.PORT || 4000));
app.listen(app.get("port"));

app.get("/", (_, res) => {
    res.status(200).send("Welcome to Helen bot")
});