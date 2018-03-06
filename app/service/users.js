const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")


const SQL_SELECT_USER = "SELECT * FROM users WHERE userid = ?"
const SQL_SELECT_USER_WITH_EMAIL = "SELECT * FROM users WHERE email = ?"
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

module.exports.insertUser = async function ({ userid, email, firstname, lastname }, passHash) {
  await db.execute(SQL_INSERT_USER, [ userid, email, passHash, firstname, lastname ])	
}
