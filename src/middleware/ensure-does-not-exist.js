function ensureDoesNotExist(model, field) {
    return (req, res, next) => {
        const queryDoc = {};
        queryDoc[field] = req.body[field];

        return model.find(queryDoc)
            .count()
            .then(count => {
                if (count) {
                    next( { status: 422, message: `${field} already exists` } );
                } else {
                    next();
                }
            });
    }
}

module.exports = { ensureDoesNotExist };