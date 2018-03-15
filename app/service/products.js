const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = `
SELECT HEX(p.ean) as ean, p.name, p.creationdate,
HEX(u.userid) as userid, u.firstname, u.lastname,
b.brandid, b.name as brandname

FROM products p
JOIN brands b on b.brandid = p.brandid
JOIN users u on u.userid = p.userid
`

const SQL_FUZZY_SEARCH_FILTER = `
WHERE p.name LIKE CONCAT('%', :searchquery, '%')`
// OR SOUNDEX(p.name) = SOUNDEX(:searchquery)`

const SQL_PAGINATION = "\nLIMIT :offset, :size"

const SQL_SELECT_PRODUCT = `
${SQL_SELECT_ALL}
WHERE HEX(p.ean) = ?`

const SQL_INSERT_PRODUCT = `
INSERT INTO products (ean, name, brandid, creationdate, userid)
VALUES (?, ?, ?, ?, ?)`

const nestProductJoins = ({ brandid, brandname, userid, firstname, lastname, ...product }) => ({
  ...product,
  brand: { brandid, brandname },
  user: { userid, firstname, lastname },
})

module.exports.fetchAll = async function (params) {
  let stmt = SQL_SELECT_ALL
  if (params.searchquery) {
    stmt += SQL_FUZZY_SEARCH_FILTER
  }
  stmt += SQL_PAGINATION
  let [ products ] = await db.execute(stmt, params)
  products = products.map(nestProductJoins)
  return { products, params }
}

module.exports.fetchProduct = async function (ean) {
  const [ rows ] = await db.execute(SQL_SELECT_PRODUCT, [ ean ])
  const product = nestProductJoins(rows[0])
  return { product }
}

module.exports.insertProduct = async function ({ ean, name, brandid, creationdate, userid }) {
  await db.execute(SQL_INSERT_PRODUCT, [ ean, name, brandid, creationdate, userid ])
}
