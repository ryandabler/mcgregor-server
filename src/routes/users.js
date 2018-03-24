"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router     = require("express").Router();
const jsonParser = require("body-parser").json();
const jwtAuth    = require("passport").authenticate("jwt", { session: false } );
const { User }   = require("../models");
const {
    checkRequiredFields,
    checkFieldType,
    validateWhitespace,
    ensureDoesNotExist
} = require("../middleware");

////////////////////////////
// Routes
////////////////////////////
router.get(
    "/",
    jwtAuth,
    (req, res) => {
        const { id } = req.user;
        User.findAndPopulate(id)
            .then(user => res.json( { users: user.populatedSerialize() } ))
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

router.post(
    "/",
    jsonParser,
    checkRequiredFields(["username", "email", "password"]),
    checkFieldType(["username", "password"], ["string", "string"]),
    validateWhitespace(["username", "password"]),
    ensureDoesNotExist(User, "username"),
    (req, res) => {
        let { username, password, email } = req.body;
        email = email.trim();

        return User.hashPassword(password)
            .then(hash => {
                return User.create({
                    username,
                    email,
                    password: hash
                });
            })
            .then(user => res.status(201).json(user.serialize()))
            .catch(err => res.status(500).json( { message: "Internal server error" } ));
});

module.exports = { router };