const { checkRequiredFields } = require("./check-required-fields");
const { checkFieldType }      = require("./check-field-type");
const { validateWhitespace }  = require("./validate-whitespace");
const { doesNotExist }        = require("./does-not-exist");

module.exports = {
    checkRequiredFields,
    checkFieldType,
    validateWhitespace,
    doesNotExist
};