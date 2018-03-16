"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// Schema
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});

// Instance methods
userSchema.methods.serialize = function() {
    return {
        id: this._id,
        username: this.username,
        email: this.email
    };
}

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
}

// Static methods
userSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
}

// Model
const User = mongoose.model("User", userSchema);

module.exports = { User };