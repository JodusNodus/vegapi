const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_INSERT_CORRECTION = "INSERT INTO usercorrections (userid, ean) VALUES (?, ?)"

module.exports.addCorrection = async function (userid, ean) {
  await db.execute(SQL_INSERT_CORRECTION, [ userid, ean ])
}
