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
      var data = {
        status: "error",
        error: error.message
      }
      res.status(httpStatus.BAD_REQUEST)
        .send(data)
    })
}
