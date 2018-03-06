const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const express = require("express")
const Q = require("q")

const { execute } = require("app/executor")
const info = require("app/info")
const configUtil = require("app/config-util")
const logger = require("app/logger").getLogger("va")

const middleware = require("app/middleware")

const passport = require("passport")
const userAuth = require("app/service/user-auth")

const routerProducts = require("app/router/products")
const routerCategories = require("app/router/categories")

const app = express()

const DEFAULT_HOST = "localhost"

/**
 * starts the application.
 *
 * @param {object} settings
 * @return {promise} the promise resolve callback is returns after the application is listening.
 */
module.exports.start = function (settings) {

  // add the config instance under "config".
  app.set("settings", settings)
  // set the application title
  app.set("title", info.getAppTitle())

  // Middlewares...

  app.use(middleware.measureTime())

  app.use(bodyParser.json())
  app.use(cookieParser())

  userAuth(passport)

  app.use(session({
    secret: "cookie cutter",
    name: "cookie",
    resave: false,
    saveUninitialized:false
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  app.use("/products", routerProducts)
  app.use("/categories", routerCategories)

  app.post("/signup", passport.authenticate("local-signup"), execute((sender, req) => {
    sender(Promise.resolve(req.user), "user")
  }))

  app.post("/login", passport.authenticate("local-login"), execute((sender, req) => {
    sender(Promise.resolve(req.user), "user")
  }))

  app.get("/logout", (req, res) => {
    req.logout()
  })

  app.get("/about", function about(req, res) {
    res.send({
      name: info.getAppName(),
      title: info.getAppTitle(),
      version: info.getAppVersion(),
      vendor: info.getAppVendor(),
      description: info.getAppDescription(),
      build: info.getBuildTimestamp()
    })
  })

  const port = configUtil.getSetting(settings, "server.port", 0)
  const host = configUtil.getSetting(settings, "server.host", DEFAULT_HOST)

  const done = Q.defer()

  if (port > 0) {
    app.listen(port, host, function () {
      logger.info("Server is listen http://", host, ":", port)
      done.resolve(true)
    })
  } else {
    process.nextTick(function () {
      done.reject("Missing the setting property \"server.port\"!")
    })
  }

  return done.promise
}
