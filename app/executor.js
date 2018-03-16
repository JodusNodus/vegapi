const httpStatus = require("app/http-status")

module.exports.execute = cb => (req, res) => {
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
      res.send({ status: "okay", result })
    })
    .catch(function (error) {
      const httpCode = typeof error === "number"
        ? error
        : httpStatus.BAD_REQUEST
      var data = {
        status: "error",
        error: typeof error === "number" ? httpStatus[httpCode] : error.message
      }
      res.status(httpCode).send(data)
    })
}
