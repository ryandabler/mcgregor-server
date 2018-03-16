"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router     = require("express").Router();
const jsonParser = require("body-parser").json();
const { Crop }   = require("../models");
const {
    checkRequiredFields,
    validateIds,
    generateUpdateDocument
} = require("../middleware");

////////////////////////////
// Routes
////////////////////////////
router.get("/", (req, res) => {
    Crop.find()
        .then(crops => {
            res.json( { crops: crops.map(crop => crop.serialize()) } );
        })
        .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.get("/:id", (req, res) => {
    const { id } = req.params;
    Crop.findById(id)
        .then(crop => {
            res.json( { crops: crop.serialize() } );
        })
        .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.post(
    "/",
    jsonParser,
    checkRequiredFields(["name", "variety", "plant_date", "germination_days", 
        "harvest_days", "userId"]),
    (req, res) => {
        const {
            name,
            variety,
            plant_date,
            germination_days,
            harvest_days,
            planting_depth,
            row_spacing,
            seed_spacing,
            userId
        } = req.body;

        Crop.create({
            name,
            variety,
            plant_date,
            germination_days,
            harvest_days,
            planting_depth,
            row_spacing,
            seed_spacing,
            userId
        })
            .then(crop => res.status(201).json(crop.serialize()))
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    Crop.findByIdAndRemove(id)
        .then(work => res.status(204).end())
        .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
        });
});

router.put(
    "/:id",
    jsonParser,
    validateIds,
    generateUpdateDocument(["name", "variety", "plant_date", "germination_days",
        "harvest_days", "planting_depth", "row_spacing", "seed_spacing"]),
    (req, res) => {
        const { id } = req.params;
        Crop.findByIdAndUpdate(id, res.locals.updatedDoc)
            .then(updatedCrop => res.status(200).end())
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

module.exports = { router };