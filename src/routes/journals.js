"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router        = require("express").Router();
const jsonParser    = require("body-parser").json();
const { Journal }   = require("../models");
const {
    checkRequiredFields,
    validateIds,
    generateUpdateDocument
} = require("../middleware");

////////////////////////////
// Routes
////////////////////////////
router.get("/", (req, res) => {
    Journal.find()
           .then(journalEntries => {
            res.json( { journal: journalEntries.map(entry => entry.serialize()) } );
           })
           .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.get("/:id", (req, res) => {
    const { id } = req.params;
    Journal.findById(id)
           .then(journalEntry => {
            res.json( { journal: journalEntry.serialize() } );
           })
           .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.post(
    "/",
    jsonParser,
    checkRequiredFields(["date", "scope", "text"]),
    (req, res) => {
        const { date, scope, text } = req.body;
        Journal.create( { date, scope, text } )
               .then(journalEntry => res.status(201).json(journalEntry.serialize()))
               .catch(err => {
                   console.error(err);
                   res.status(500).json( { message: "Internal server error" } );
               });
    }
);

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    Journal.findByIdAndRemove(id)
        .then(journalEntry => res.status(204).end())
        .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.put(
    "/:id",
    jsonParser,
    validateIds,
    generateUpdateDocument(["date", "scope", "text"]),
    (req, res) => {
        const { id } = req.params;
        Journal.findByIdAndUpdate(id, res.locals.updatedDoc)
            .then(updatedJournalEntry => res.status(200).end())
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

module.exports = { router };