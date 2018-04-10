const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

const SQL_INSERT = "INSERT INTO userratings (userid, ean, rating) VALUES (?, ?, ?)"

module.exports.addRating = async function (userid, ean, rating) {
  await knex("userratings").insert({ userid, ean, rating })
}
