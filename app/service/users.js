const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")
const cache = require("app/cache")


const SQL_SELECT_USERS = "SELECT userid as userid, password, firstname, lastname FROM users"
const SQL_SELECT_USER = SQL_SELECT_USERS + " WHERE userid = ?"
const SQL_SELECT_USER_WITH_EMAIL = SQL_SELECT_USERS + " WHERE email = ?"
const SQL_INSERT_USER = `
INSERT INTO users (email, password, firstname, lastname)
VALUES (?, ?, ?, ?)`

module.exports.fetchUser = (userid) =>
  cache.wrap(`fetchUser-${userid}`, async function () {
    const [ rows ] = await db.execute(SQL_SELECT_USER, [ userid ])
    return rows[0]
  }, {ttl: 60 * 60})

module.exports.fetchUserWithEmail = async function (email) {
  console.log(email)
  const [ rows ] = await db.execute(SQL_SELECT_USER_WITH_EMAIL, [ email ])
  console.log(rows[0])
  return rows[0]
}

module.exports.insertUser = async function ({ email, firstname, lastname, passHash }) {
  await db.execute(SQL_INSERT_USER, [ email, passHash, firstname, lastname ])	
}
