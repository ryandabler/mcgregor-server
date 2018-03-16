function validateIds(req, res, next) {
    (req.params.id && req.body.id && req.params.id === req.body.id)
      ? next()
      : next( { status: 400, message: "Please ensure the correctness of the ids" } );
  }

  module.exports = { validateIds };