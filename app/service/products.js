const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = `
SELECT HEX(p.ean) as ean, p.name, p.creationdate,
b.brandid, b.name as brandname

FROM products p
JOIN brands b on b.brandid = p.brandid`

const SQL_FUZZY_SEARCH_FILTER = `
WHERE p.name LIKE CONCAT('%', :searchquery, '%')`
// OR SOUNDEX(p.name) = SOUNDEX(:searchquery)`

const SQL_PAGINATION = "\nLIMIT :offset, :size"

const SQL_SELECT_PRODUCT = `
SELECT HEX(p.ean) as ean, p.name, p.creationdate,
HEX(u.userid) as userid, u.firstname, u.lastname,
b.brandid, b.name as brandname,
(SELECT COUNT(*) FROM usercorrections uc WHERE uc.ean = p.ean AND uc.userid = :userid) as userHasCorrected

FROM products p
JOIN brands b on b.brandid = p.brandid
JOIN users u on u.userid = p.userid

WHERE HEX(p.ean) = :ean`

const SQL_INSERT_PRODUCT = `
INSERT INTO products (ean, name, brandid, creationdate, userid)
VALUES (?, ?, ?, ?, ?)`


const nestProductJoins = ({ brandid, brandname, userid, firstname, lastname, ...product }) => ({
  ...product,
  brand: { brandid, brandname },
  user: userid ? { userid, firstname, lastname } : undefined,
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

module.exports.fetchProduct = async function (ean, userid) {
  const [ rows ] = await db.execute(SQL_SELECT_PRODUCT, { ean, userid })
  const product = nestProductJoins(rows[0])
  product.userHasCorrected = !!product.userHasCorrected
  return { product }
}

module.exports.insertProduct = async function ({ ean, name, brandid, creationdate, userid }) {
  await db.execute(SQL_INSERT_PRODUCT, [ ean, name, brandid, creationdate, userid ])
}
