const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT * FROM brands"
const SQL_INSERT = "INSERT INTO brands VALUES (name) (?)"

module.exports.fetchAll = async function () {
  const [ brands ] = await db.query(SQL_SELECT_ALL)
  return { brands }
}

module.exports.insertBrand = async function (brandname) {
  await db.query(SQL_INSERT, [ brandname ])
}
