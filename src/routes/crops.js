"use strict";

////////////////////////////
// Initialize
////////////////////////////
const router     = require("express").Router();
const jsonParser = require("body-parser").json();
const jwtAuth    = require("passport").authenticate("jwt", { session: false } );
const { Crop }   = require("../models");
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
        Crop.find( { userId: req.user.id } )
            .then(crops => {
                res.json( { crops: crops.map(crop => crop.serialize()) } );
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
        Crop.find( { _id: id, userId: req.user.id } )
            .then(crop => {
                res.json( { crops: crop.map(crop => crop.serialize()) } );
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
            seed_spacing
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
            userId: req.user.id
        })
            .then(crop => res.status(201).json(crop.serialize()))
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
        Crop.findOneAndRemove( { _id: id, userId: req.user.id } )
            .then(work => res.status(204).end())
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
    generateUpdateDocument(["name", "variety", "plant_date", "germination_days",
        "harvest_days", "planting_depth", "row_spacing", "seed_spacing"]),
    (req, res) => {
        const { id } = req.params;
        Crop.findOneAndUpdate( {_id: id, userId: req.user.id }, res.locals.updatedDoc)
            .then(updatedCrop => res.status(200).end())
            .catch(err => {
                console.error(err);
                res.status(500).json( { message: "Internal server error" } );
            });
    }
);

module.exports = { router };