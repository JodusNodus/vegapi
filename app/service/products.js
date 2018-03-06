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

module.exports.fetchAll = async function ({ categoryid, offset, size, searchquery }) {
  let stmt = SQL_SELECT_ALL
  const params = {
    offset: offset ? parseInt(offset) : 0,
    size: size ? parseInt(size) : 10
  }

  if (categoryid) {
    params.categoryid = parseInt(categoryid)
    stmt += SQL_CATEGORY_FILTER
  }

  if (searchquery) {
    params.searchquery = searchquery
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
