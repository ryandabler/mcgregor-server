"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router        = require("express").Router();
const jsonParser    = require("body-parser").json();
const jwtAuth    = require("passport").authenticate("jwt", { session: false } );
const { Journal }   = require("../models");
const {
    checkRequiredFields,
    validateIds,
    generateUpdateDocument
} = require("../middleware");

////////////////////////////
// Routes
////////////////////////////
router.get(
    "/",
    jwtAuth,
    (req, res) => {
        Journal.find( { userId: req.user.id } )
            .then(journalEntries => {
                res.json( { journal: journalEntries.map(entry => entry.serialize()) } );
            })
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
});

router.get(
    "/:id",
    jwtAuth,
    (req, res) => {
        const { id } = req.params;
        Journal.find( { _id: id, userId: req.user.id } )
            .then(journalEntry => {
                res.json( { journal: journalEntry.map(je => je.serialize()) } );
            })
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
});

router.post(
    "/",
    jwtAuth,
    jsonParser,
    checkRequiredFields(["date", "scope", "text"]),
    (req, res) => {
        const { date, scope, text } = req.body;
        Journal.create( { date, scope, text, userId: req.user.id } )
               .then(journalEntry => res.status(201).json(journalEntry.serialize()))
               .catch(err => {
                   console.error(err);
                   res.status(500).json( { message: "Internal server error" } );
               });
    }
);

router.delete(
    "/:id",
    jwtAuth,
    (req, res) => {
        const { id } = req.params;
        Journal.findOneAndRemove( {_id: id, userId: req.user.id } )
            .then(journalEntry => res.status(204).end())
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
});

router.put(
    "/:id",
    jwtAuth,
    jsonParser,
    validateIds,
    generateUpdateDocument(["date", "scope", "text"]),
    (req, res) => {
        const { id } = req.params;
        Journal.findOneAndUpdate( { _id: id, userId: req.user.id }, res.locals.updatedDoc)
            .then(updatedJournalEntry => res.status(200).end())
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

module.exports = { router };