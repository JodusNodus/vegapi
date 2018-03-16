const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT * FROM brands"

module.exports.fetchAll = async function (options) {
  const [ brands ] = await db.query(SQL_SELECT_ALL)
  return { brands }
}
