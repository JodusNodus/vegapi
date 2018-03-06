const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = `
SELECT HEX(p.ean) as ean, p.name, b.name as brandname, c.name as category, p.creationdate FROM products p
JOIN brands b on b.brandid = p.brandid
JOIN categories c on c.categoryid = p.categoryid
`

const SQL_CATEGORY_FILTER = "\nWHERE p.categoryid = :categoryid"

const SQL_FUZZY_SEARCH_FILTER = `
WHERE p.name LIKE CONCAT('%', :searchquery, '%')`
// OR SOUNDEX(p.name) = SOUNDEX(:searchquery)`

const SQL_PAGINATION = "\nLIMIT :offset, :size"

const SQL_SELECT_PRODUCT = `
${SQL_SELECT_ALL}
WHERE HEX(p.ean) = ?`

const SQL_INSERT_PRODUCT = `
INSERT INTO products (ean, name, categoryid, brandid, creationdate)
VALUES (?, ?, ?, ?, ?)`

module.exports.fetchAll = async function (params) {
  let stmt = SQL_SELECT_ALL
  if (params.categoryid) {
    stmt += SQL_CATEGORY_FILTER
  }
  if (params.searchquery) {
    stmt += SQL_FUZZY_SEARCH_FILTER
  }
  stmt += SQL_PAGINATION
  const [ products ] = await db.execute(stmt, params)
  return { products, params }
}

module.exports.fetchProduct = async function (ean) {
  const [ rows ] = await db.execute(SQL_SELECT_PRODUCT, [ ean ])
  return { product: rows[0] }
}

module.exports.insertProduct = async function ({ ean, name, categoryid, brandid, creationdate }) {
  await db.execute(SQL_INSERT_PRODUCT, [ ean, name, categoryid, brandid, creationdate ])
}
