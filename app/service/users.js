const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")


const SQL_SELECT_USERS = "SELECT HEX(userid) as userid, password, firstname, lastname FROM users"
const SQL_SELECT_USER = SQL_SELECT_USERS + " WHERE HEX(userid) = ?"
const SQL_SELECT_USER_WITH_EMAIL = SQL_SELECT_USERS + " WHERE email = ?"
const SQL_INSERT_USER = `
INSERT INTO users (userid, email, password, firstname, lastname)
VALUES (?, ?, ?, ?, ?)`

module.exports.fetchUser = async function (userid) {
  const [ rows ] = await db.execute(SQL_SELECT_USER, [ userid ])
  return rows[0]
}

module.exports.fetchUserWithEmail = async function (email) {
  const [ rows ] = await db.execute(SQL_SELECT_USER_WITH_EMAIL, [ email ])
  return rows[0]
}

module.exports.insertUser = async function ({ email, firstname, lastname, userid, passHash }) {
  await db.execute(SQL_INSERT_USER, [ userid, email, passHash, firstname, lastname ])	
}
