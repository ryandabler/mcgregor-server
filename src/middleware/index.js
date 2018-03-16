const { checkRequiredFields }    = require("./check-required-fields");
const { checkFieldType }         = require("./check-field-type");
const { validateWhitespace }     = require("./validate-whitespace");
const { ensureDoesNotExist }     = require("./ensure-does-not-exist");
const { validateIds }            = require("./validate-ids");
const { generateUpdateDocument } = require("./generate-update-document");

module.exports = {
    checkRequiredFields,
    checkFieldType,
    validateWhitespace,
    ensureDoesNotExist,
    validateIds,
    generateUpdateDocument
};