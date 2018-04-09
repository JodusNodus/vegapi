const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = `
SELECT p.ean as ean, p.name,
b.brandid, b.name as brandname

FROM products p
JOIN brands b on b.brandid = p.brandid`

const SQL_FUZZY_SEARCH_FILTER = `
WHERE p.name LIKE CONCAT('%', :searchquery, '%')`
// OR SOUNDEX(p.name) = SOUNDEX(:searchquery)`

const SQL_PAGINATION = "\nLIMIT :offset, :size"

const SQL_PRODUCT_EXISTS = `SELECT ean FROM products WHERE ean = ?`

const SQL_SELECT_PRODUCT = `
SELECT p.ean, p.name, DATE_FORMAT(p.creationdate, "%d/%m/%Y") as creationdate,
u.userid, u.firstname, u.lastname,
b.brandid, b.name as brandname,
(SELECT COUNT(*) FROM usercorrections uc WHERE uc.ean = p.ean AND uc.userid = :userid) as userHasCorrected,
(SELECT SUM(rating) / COUNT(rating) FROM userratings ur WHERE ur.ean = p.ean) as rating

FROM products p
JOIN brands b on b.brandid = p.brandid
JOIN users u on u.userid = p.userid

WHERE p.ean = :ean`

const SQL_INSERT_PRODUCT = `
INSERT INTO products (ean, name, brandid, creationdate, userid)
VALUES (?, ?, ?, ?, ?)`


const nestProductJoins = ({ brandid, brandname, userid, firstname, lastname, ...product }) => ({
  ...product,
  brand: { brandid, name: brandname },
  user: userid ? { userid, firstname, lastname } : undefined,
})

module.exports.fetchAll = async function ({ searchquery, size, page }) {
  const offset = size * (page - 1)
  let stmt = SQL_SELECT_ALL
  + SQL_FUZZY_SEARCH_FILTER
  + SQL_PAGINATION
  let [ products ] = await db.execute(stmt, { searchquery, size, offset })
  products = products.map(nestProductJoins)
  return products
}

module.exports.productExists = async function(ean) {
  const [ rows ] = await db.execute(SQL_PRODUCT_EXISTS, [ ean ])
  return rows.length > 0
}

module.exports.fetchProduct = async function (ean, userid) {
  const [ rows ] = await db.execute(SQL_SELECT_PRODUCT, { ean, userid })
  if (rows.length < 1) {
    return
  }
  const product = nestProductJoins(rows[0])
  product.userHasCorrected = !!product.userHasCorrected
  product.rating = Math.round(product.rating || 0)
  return product
}

module.exports.insertProduct = async function ({ ean, name, brandid, creationdate, userid }) {
  await db.execute(SQL_INSERT_PRODUCT, [ ean, name, brandid, creationdate, userid ])
}
