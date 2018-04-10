const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

const nestProductJoins = ({ brandid, brandName, userid, userFirstname, userLastname, ...product }) => ({
  ...product,
  brand: { brandid, name: brandName },
  user: userid ? { userid, firstname: userFirstname, lastname: userLastname } : undefined,
})

module.exports.fetchAll = async function ({ searchquery, size, page, orderby, labels }) {
  let stmt = knex({ p: "products" })
    .select("p.ean", "p.name", { brandid: "b.brandid" }, { brandName: "b.name" })
    .join("brands as b", "b.brandid", "p.brandid")
    .join("productlabels as pl", "pl.ean", "p.ean")
    .join("labels as l", "l.labelid", "pl.labelid")

  if (labels.length > 0) {
    stmt.whereIn("l.name", labels)
  }

  if (searchquery) {
    stmt.whereRaw(`p.name LIKE CONCAT('%',?,'%')`, [ searchquery.toLowerCase() ])
  }

  stmt.groupBy("p.ean")

  if (orderby === "creationdate") {
    stmt.orderBy(orderby, "desc")
  }

  const offset = size * (page - 1)
  stmt
    .offset(offset)
    .limit(size)

  let products = await stmt;
  products = products.map(nestProductJoins)
  return products
}

module.exports.productExists = async function(ean) {
  const rows = await knex("products").select("ean").where({ ean })
  return rows.length > 0
}

module.exports.fetchProduct = async function (ean, userid) {
  const userHasCorrectedStmt = knex("usercorrections")
    .count()
    .where({ ean, userid })
  const ratingStmt = knex("userratings")
    .select(knex.raw("SUM(rating) / COUNT(rating)"))
    .where({ ean })
  const userRatingStmt = knex("userratings")
    .select("rating")
    .where({ ean, userid })
  const rows = await knex({ p: "products" })
    .select(
      "p.ean",
      "p.name",
      { creationdate: knex.raw('DATE_FORMAT(p.creationdate, "%d/%m/%Y")') },
      { userHasCorrected: userHasCorrectedStmt },
      { rating: ratingStmt },
      { userRating: userRatingStmt },
      "u.userid",
      { userFirstname: "u.firstname" },
      { userLastname: "u.lastname" },
      "b.brandid",
      { brandName: "b.name" },
    )
    .join("users as u", "u.userid", "p.userid")
    .join("brands as b", "b.brandid", "p.brandid")
    .where({ ean })
  
  const product = nestProductJoins(rows[0])
  product.userHasCorrected = !!product.userHasCorrected
  product.rating = Math.round(product.rating || 0)
  product.userRating = product.userRating || 0
  return product
}

module.exports.insertProduct = async function ({ ean, name, brandid, creationdate, userid }) {
  await knex("products").insert({ ean, name, brandid, creationdate, userid })
}
