function generateUpdateDocument(updateableFields) {
    return (req, res, next) => {
      const updatedDoc = {};
      updateableFields.forEach(field => {
        if (field in req.body) {
          updatedDoc[field] = req.body[field];
        }
      });
      
      res.locals.updatedDoc = updatedDoc;
      next();
    };
}

module.exports = { generateUpdateDocument };