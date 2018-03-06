const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT * FROM categories"

module.exports.fetchAll = async function (options) {
  const [ categories ] = await db.query(SQL_SELECT_ALL)
  return { categories }
}
