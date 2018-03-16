const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_INSERT = "INSERT INTO userratings (userid, ean, rating) VALUES (?, ?, ?)"

module.exports.addRating = async function (userid, ean, rating) {
  await db.execute(SQL_INSERT, [ userid, ean, rating ])
}
