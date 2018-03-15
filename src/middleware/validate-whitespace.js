function validateWhitespace(fieldsArr) {
    return (req, res, next) => {
        const nonTrimmedFields = fieldsArr.filter(field =>
            field in req.body && req.body[field].trim() !== req.body[field]
        );

        if (nonTrimmedFields.length) {
            next( { status: 422, message: `The following begin or end with whitespace: '${nonTrimmedFields.join("', '")}'` } );
        } else {
            next();
        }
    };
}

module.exports = { validateWhitespace };