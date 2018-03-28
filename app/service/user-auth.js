const db = require("mysql2-promise")()
const LocalStrategy = require("passport-local").Strategy
const instauuid = require("instauuid")
const bcrypt = require("../bcrypt")
const usersService = require("./users")
const cache = require("app/cache")

module.exports = function(passport) {

  passport.serializeUser(serializeUser)
  passport.deserializeUser(deserializeUser)

  const passportOptions = {
    usernameField : "email",
    passwordField : "password",
    passReqToCallback : true
  }
  passport.use("local-signup", new LocalStrategy(passportOptions, signup))
  passport.use("local-login", new LocalStrategy(passportOptions, login))
}

const cleanUserObj = (user) => ({ ...user, password: undefined })

function serializeUser(user, done) {
  return done(null, user.userid)
}

async function deserializeUser (userid, cb) {
  try {
    const user = await usersService.fetchUser(userid)
    if (!user) {
      cb("not found")
    } else {
      cb(null, user)
    }
  } catch(err) {
    cb(err)
  }
}

async function signup(req, email, password, done) {
  try {
    const { firstname, lastname } = req.body
    let user = await usersService.fetchUserWithEmail(email)
    if (user) {
      return done(null, false)
    }
    const passHash = await bcrypt.hash(password)

    await usersService.insertUser({ email, firstname, passHash, lastname })
    user = await usersService.fetchUserWithEmail(email)

    done(null, cleanUserObj(user))
  } catch (err) {
    done(err)
  }
}

async function login(req, email, password, done) {
  try {
    let user = await usersService.fetchUserWithEmail(email)
    if (!user) {
      return done(null, false)
    }
    if (await bcrypt.compare(password, user.password)) {
      done(null, cleanUserObj(user))
    } else {
      done(null, false)
    }
  } catch (err) {
    done(err)
  }
}
