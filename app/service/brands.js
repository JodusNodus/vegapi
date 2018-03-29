const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT brandid, name FROM brands"
const SQL_INSERT = "INSERT INTO brands (name) VALUES (?)"

const SQL_BRAND_SEACH_FILTER = "name LIKE CONCAT('%', ?, '%')"

module.exports.fetchAll = async function () {
  const [ brands ] = await db.query(SQL_SELECT_ALL)
  return brands
}

module.exports.findWithNames = async function (names) {
  const words = names.join(" ").split(/[^a-z0-9àâäèéêëîïôœùûüÿç]/g)
  let brands = await module.exports.fetchAll()
  brands = brands.filter(brand => words.indexOf(brand.name) > -1)
  return brands
}
