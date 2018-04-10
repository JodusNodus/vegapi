const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

module.exports.addCorrection = async function (userid, ean) {
  await knex("usercorrections").insert({ userid, ean })
}
