const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT * FROM brands"
const SQL_INSERT = "INSERT INTO brands (name) VALUES (?)"

module.exports.fetchAll = async function () {
  const [ brands ] = await db.query(SQL_SELECT_ALL)
  return brands
}

module.exports.insertBrand = async function (brandname) {
  const [ result ] = await db.execute(SQL_INSERT, [ brandname ])
  return result.insertId
}
