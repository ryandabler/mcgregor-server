function checkFieldType(fieldsArr, typeArr) {
    return (req, res, next) => {
        const malformedFields = fieldsArr.filter((field, idx) => 
            field in req.body && typeof req.body[field] !== typeArr[idx]
        );

        if (malformedFields.length) {
            next( { status: 422, message: `Incorrect field types for the following fields: '${malformedFields.join("', '")}'` } );
        } else {
            next();
        }
    };
}

module.exports = { checkFieldType };