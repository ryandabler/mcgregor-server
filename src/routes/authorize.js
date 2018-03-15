"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router     = require("express").Router();
const passport   = require("passport");
const jsonParser = require("body-parser").json();
const jwt        = require("jsonwebtoken");

const { JWT_SECRET, JWT_EXPIRY } = require("../config");

const createAuthToken = function(user) {
    return jwt.sign({ user }, JWT_SECRET, {
        subject: user.username,
        expiresIn: JWT_EXPIRY,
        algorithm: "HS256"
    });
}

const localAuth = passport.authenticate("local", { session: false } );
const jwtAuth   = passport.authenticate("jwt", { session: false } );

////////////////////////////
// Routes
////////////////////////////
router.post(
    "/login",
    jsonParser,
    localAuth,
    (req, res) => {
        const authToken = createAuthToken(req.user.serialize());
        res.json( { authToken } );
    }
);

router.post(
    "/refresh",
    jwtAuth,
    (req, res) => {
        const authToken = createAuthToken(req.user);
        res.json( { authToken } );
    }
);

module.exports = { router };