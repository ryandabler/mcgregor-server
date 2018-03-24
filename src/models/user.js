"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// Schema
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
}, { toJSON: { virtuals: true } } );

userSchema.virtual("crops", {
    ref: "Crop",
    localField: "_id",
    foreignField: "userId"
});

userSchema.virtual("journal", {
    ref: "Journal",
    localField: "_id",
    foreignField: "userId"
});

// Instance methods
userSchema.methods.serialize = function() {
    return {
        id: this._id,
        username: this.username,
        email: this.email
    };
}

userSchema.methods.populatedSerialize = function() {
    const user = this.toJSON();
    const crops = this.crops.map(crop => {
        return crop.serialize();
    });
    return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        crops
    };
}

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
}

// Static methods
userSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
}

userSchema.statics.findAndPopulate = function(id = null) {
    return User.findById(id)
               .populate( { path: "crops" } );
};

// Model
const User = mongoose.model("User", userSchema);

module.exports = { User };