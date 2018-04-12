const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const MemcachedStore = require('connect-memjs')(session)
const express = require("express")
const Q = require("q")

const cache = require("app/cache")
const { execute } = require("app/executor")
const info = require("app/info")
const configUtil = require("app/config-util")
const logger = require("app/logger").getLogger("va")

const middleware = require("app/middleware")

const { check } = require("express-validator/check")
const { matchedData, sanitize } = require("express-validator/filter")

const passport = require("passport")
const userAuth = require("app/service/user-auth")

const routerAPI = require("app/router/api")
const routerTasks = require("app/router/tasks")
const routerImages = require("app/router/images")

const app = express()

/**
 * starts the application.
 *
 * @param {object} settings
 * @return {promise} the promise resolve callback is returns after the application is listening.
 */
module.exports.start = function (settings) {

  app.disable("etag")
  app.set("trust proxy", true)

  // add the config instance under "config".
  app.set("settings", settings)
  // set the application title
  app.set("title", info.getAppTitle())

  app.use(middleware.measureTime())

  app.use(bodyParser.json())
  // app.use(cookieParser())

  userAuth(passport)

  const sessionConfig = {
    store: new MemcachedStore({ client: cache.client }),
    secret: configUtil.getSetting(settings, "secret"),
    sign: true,
    resave: false,
    saveUninitialized:false
  }
  app.use(session(sessionConfig))

  app.use(passport.initialize())
  app.use(passport.session())

  app.use("/api", routerAPI)
  app.use("/tasks", routerTasks)
  app.use("/images", routerImages)

  app.post("/signup", [
    check("email").isEmail(),
    check("password").exists(),
    check("firstname").exists(),
    check("lastname").exists(),
    passport.authenticate("local-signup"),
  ], execute(async function(req) {
    return { user: req.user }
  }))

  app.post("/login", [
    check("email").isEmail(),
    check("password").exists(),
    passport.authenticate("local-login"),
  ], execute(async function(req) {
    return { user: req.user }
  }))

  app.post("/logout", execute(async function(req) {
    req.logout()
    req.session.destroy()
    return {}
  }))

  const port = configUtil.getSetting(settings, "server.port", 0)

  const done = Q.defer()

  if (port > 0) {
    app.listen(port, function () {
      logger.info(`Server is listenening on ${port}`)
      done.resolve(true)
    })
  } else {
    process.nextTick(function () {
      done.reject("Missing the setting property \"server.port\"!")
    })
  }

  return done.promise
}
