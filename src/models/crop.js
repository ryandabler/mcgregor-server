"use strict";

const mongoose = require("mongoose");

// Schema
const cropSchema = mongoose.Schema({
    name: { type: String, required: true },
    variety: { type: String, required: true },
    plant_date: { type: Date, required: true },
    germination_days: { type: Number, required: true },
    harvest_days: { type: Number, required: true },
    planting_depth: Number,
    row_spacing: Number,
    seed_spacing: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }
});

// Instance methods
cropSchema.methods.serialize = function() {
    return {
        name: this.name,
        variety: this.variety,
        plant_date: this.plant_date,
        germination_days: this.germination_days,
        harvest_days: this.harvest_days,
        planting_depth: this.planting_depth,
        row_spacing: this.row_spacing,
        seed_spacing: this.seed_spacing
    }
}

// Model
const Crop = mongoose.model("Crop", cropSchema);

module.exports = { Crop };