/*
 * vegapi - https://github.com/jodusnodus/vegapi.git
 *
 * Copyright (c) 2018 JodusNodus
 */

/**
 * Capsules in a Endpoint the service calls and claims Exception
 *
 * **Example**
 * ```js
 * router.post('/user', function (req, res) {
 *   executor.execute(req, res, function (sender) {
 *
 *     const userModel = req.body;
 *     const promise   = service.save(userModel);
 *     const property  = 'result';
 *
 *     sender(promise, property);
 *   });
 * });
 * ```
 */

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
