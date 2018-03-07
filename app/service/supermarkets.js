const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_RETAILCHAINS = `
SELECT retailchainid, name FROM retailchains
ORDER BY CHAR_LENGTH(name) DESC`

const SQL_SELECT_BY_PLACEIDS = `
SELECT placeid, retailchainid FROM supermarkets
WHERE placeid IN `

const SQL_INSERT_SUPERMARKETS = "INSERT INTO supermarkets (placeid, retailchainid) VALUES "

module.exports.fetchRetailChains = async function () {
  const [ retailChains ] = await db.query(SQL_SELECT_RETAILCHAINS)
  return retailChains
}

module.exports.fetchByPlaces = async function (places) {
  const data = places.map(({ placeid }) => `'${placeid}'`)
  const query = SQL_SELECT_BY_PLACEIDS + "(" + data.join(", ") + ")"
  const [ supermarkets ] = await db.query(query)
  return supermarkets
}

module.exports.insertSupermarkets = async function (supermarkets) {
  const data = supermarkets
    .map(({ placeid, retailchainid }) => `('${placeid}', ${retailchainid})`)
  const query = SQL_INSERT_SUPERMARKETS + data.join(", ")
  await db.query(query)
}
