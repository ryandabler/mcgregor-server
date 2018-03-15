"use strict";

////////////////////////////
// Initialize
////////////////////////////
require("dotenv").config();

const express  = require('express');
const mongoose = require("mongoose");

const app = express();
const { PORT, DATABASE_URL } = require("./config");

////////////////////////////
// Set up application
////////////////////////////
app.use(express.static("public"));

// CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    next();
});

// Log HTTP layer
app.use(morgan("common"));

// Routes
app.get('/api/*', (req, res) => {
    res.json({ok: true});
});

// Error handling
app.use((err, req, res, next) => {
    res.status(err.status).json({ message: err.message });
});

////////////////////////////
// Set up server
////////////////////////////
mongoose.Promise = global.Promise;

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, {}, err => {
            if (err) return reject(err);
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            }).on("error", err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };