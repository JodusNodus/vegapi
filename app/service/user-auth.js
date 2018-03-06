const db = require("mysql2-promise")()
const LocalStrategy = require("passport-local").Strategy
const instauuid = require("instauuid")
const bcrypt = require("../bcrypt")
const usersService = require("./users")

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

function serializeUser(user, done) {
  return done(null, user.userid)
}

function deserializeUser(userid, done) {
  usersService.fetchUser(userid)
    .then(user => {
      done(null, user)
    })
    .catch(err => done(err))
}

async function signup(req, email, password, done) {
  try {
    const { firstname, lastname } = req.body
    let user = await usersService.fetchUserWithEmail(email)
    if (user) {
      return done(null, false)
    }
    const userid = instauuid("buffer")
    const passHash = await bcrypt.hash(password)

    await usersService.insertUser({ userid, passHash, email, firstname, lastname })
    user = await usersService.fetchUserWithEmail(email)

    done(null, user)
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
    const { userid, firstname, lastname, password: passHash } = user
    if (await bcrypt.compare(password, passHash)) {
      const user = { userid, email, firstname, lastname }
      done(null, user)
    } else {
      done(null, false)
    }
  } catch (err) {
    done(err)
  }
}
