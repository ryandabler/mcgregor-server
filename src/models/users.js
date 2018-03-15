"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

// Schema
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

// Instance methods
userSchema.methods.serialize = function() {
    return {
        username: this.username
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

module.export = { User };