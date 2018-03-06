const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_RETAILCHAINS = `
SELECT retailchainid, name FROM retailchains
ORDER BY CHAR_LENGTH(name) DESC`

const SQL_SELECT_BY_PLACEIDS = `
SELECT retailchainid FROM supermarkets
WHERE placeid IN ?`

module.exports.fetchRetailChains = async function () {
  const [ retailChains ] = await db.query(SQL_SELECT_RETAILCHAINS)
  return retailChains
}

module.exports.fetchByPlaceids = async function (placeids) {
  const [ supermarkets ] = await db.execute(SQL_SELECT_BY_PLACEIDS, [ placeids ])
  return supermarkets
}

module.exports.insertSupermarket = async function ({ placeid, lat, lng, retailchainid }) {
  const [ retailChains ] = await db.query(SQL_SELECT_RETAILCHAINS)
}
