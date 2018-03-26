"use strict";

const mongoose = require("mongoose");

// Schema
const journalSchema = mongoose.Schema({
    date: { type: Date, required: true },
    scope: mongoose.Schema.Types.ObjectId,
    text: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }
});

// Instance methods
journalSchema.methods.serialize = function() {
    return {
        id: this._id,
        date: this.date,
        scope: this.scope,
        text: this.text
    };
}

// Model
const Journal = mongoose.model("Journal", journalSchema);

module.exports = { Journal };