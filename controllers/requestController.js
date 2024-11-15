const Request = require('../models/requestModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')

exports.createRequest = async (req, res, next) => {
  try {
    const request = new Request(req.body);
    await request.save();
    return next(createSuccess(200, "Request Created", request));
  } catch (err) {
    return next(createError(500, "Internal Server Error"))
  }
};


