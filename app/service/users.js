const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")
const cache = require("app/cache")


const SQL_SELECT_USERS = "SELECT userid as userid, password, firstname, lastname FROM users"
const SQL_SELECT_USER = SQL_SELECT_USERS + " WHERE userid = ?"
const SQL_SELECT_USER_WITH_EMAIL = SQL_SELECT_USERS + " WHERE email = ?"
const SQL_INSERT_USER = `
INSERT INTO users (email, password, firstname, lastname)
VALUES (?, ?, ?, ?)`

const userColumns = {
  userid: "userid",
  password: "password",
  firstname: "firstname",
  lastname: "lastname"
}

module.exports.fetchUser = (userid) =>
  cache.wrap(`fetchUser2-${userid}`, async function () {
    const rows = await knex("users")
      .select(userColumns)
      .where({ userid })
    return rows[0]
  }, {ttl: 60 * 60})

module.exports.fetchUserWithEmail = async function (email) {
  const rows = await knex("users")
    .select(userColumns)
    .where({ email })
  return rows[0]
}

module.exports.insertUser = async function ({ email, firstname, lastname, passHash }) {
  await knex("users")
    .insert({ email, firstname, lastname, password: passHash })
}
