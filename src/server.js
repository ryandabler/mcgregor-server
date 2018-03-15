"use strict";

require("dotenv").configure();

const express = require('express');
const app = express();

const { PORT, DATABASE_URL } = require("./config");

app.get('/api/*', (req, res) => {
    res.json({ok: true});
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = { app };