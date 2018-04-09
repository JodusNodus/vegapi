const { check, validationResult } = require("express-validator/check")
const httpStatus = require("app/http-status")

function errorResponse(error, res) {
  const httpCode = typeof error === "number"
    ? error
    : httpStatus.BAD_REQUEST
  var data = {
    status: "error",
    error: typeof error === "number" ? httpStatus[httpCode] : error.message
  }
  res.status(httpCode).send(data)
}

module.exports.execute = cb => (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    errorResponse(httpStatus.BAD_REQUEST, res)
    return
  }
  const promise = cb(req, res)
  if (!promise.then) {
    res.status(httpStatus.SERVER_ERROR)
      .send({
        status: "error",
        message: "Could not found a result"
      })
    return
  }
  promise
    .then(function (result) {
      res.send(result)
    })
    .catch(function (error) {
      errorResponse(error, res)
    })
}
