function checkRequiredFields(fieldsArr) {
    return (req, res, next) => {
      const missingFields = fieldsArr.filter(field => !(field in req.body));
      if (missingFields.length > 0) {
        next( { status: 400, message: `The request is missing the following field(s): '${missingFields.join("', '")}'` } );
      } else {
        next();
      }
    };
  }

  module.exports = { checkRequiredFields };