const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

module.exports.fetchAll = async function () {
  const brands = await knex("brands").select("brandid", "name")
  return brands
}

module.exports.insertBrand = async function (name) {
  const labelid = await knex("brands")
    .insert({ name })
    .returning("labelid")
  return labelid 
}

module.exports.fetchWithName = async function (name) {
  const brands = await knex("brands")
    .select("brandid", "name")
    .where({ name })
  return brands[0]
}

module.exports.findWithNames = async function (names) {
  const words = names.join(" ").split(/[^a-z0-9àâäèéêëîïôœùûüÿç]/g)
  let brands = await module.exports.fetchAll()
  brands = brands.filter(brand => words.indexOf(brand.name) > -1)
  return brands
}
