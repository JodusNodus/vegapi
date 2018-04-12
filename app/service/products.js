const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

const nestProductJoins = ({ brandid, brandName, userid, userFirstname, userLastname, ...product }) => ({
  ...product,
  brand: { brandid, name: brandName },
  user: userid ? { userid, firstname: userFirstname, lastname: userLastname } : undefined,
})

module.exports.paginateAll = async function ({ searchquery, size, page, orderby, labels=[] }) {
  let stmt = knex({ p: "products" })
    .join("brands as b", "b.brandid", "p.brandid")
    .leftJoin("productlabels as pl", "pl.ean", "p.ean")
    .leftJoin("labels as l", "l.labelid", "pl.labelid")

  if (labels.length > 0) {
    stmt.whereIn("l.name", labels)
  }

  if (searchquery) {
    stmt.whereRaw(`p.name LIKE CONCAT('%',?,'%')`, [ searchquery.toLowerCase() ])
  }

  const totalStmt = stmt.clone().countDistinct("p.ean as count").first()

  stmt.select("p.ean", "p.name", "p.hits", { brandid: "b.brandid" }, { brandName: "b.name" })
  stmt.groupBy("p.ean")

  if (orderby === "creationdate") {
    stmt.orderBy(orderby, "desc")
  }

  const offset = size * (page - 1)
  stmt
    .offset(offset)
    .limit(size)

  const products = await stmt
  const { count } = await totalStmt
  return { products, total: count }
}

module.exports.fetchAllEans = async function(size = 100000, page = 1) {
  const offset = size * (page - 1)
  return await knex("products")
    .pluck("ean")
    .offset(offset)
    .limit(size)
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

  if (rows.length == 0) return

  const product = nestProductJoins(rows[0])
  product.userHasCorrected = !!product.userHasCorrected
  product.rating = Math.round(product.rating || 0)
  product.userRating = product.userRating || 0
  return product
}

module.exports.insertProduct = async function ({ ean, name, brandid, creationdate, userid }) {
  await knex("products").insert({ ean, name, brandid, creationdate, userid, hits: 0 })
}

module.exports.updateProductHits = async function(ean, hits) {
  await knex("products").where({ ean }).update({ hits })
}
