const _ = require("lodash")
const args = require("app/args")
const cache = require("app/cache")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")
const gmapsService = require("app/service/gmaps")

const SQL_SELECT_RETAILCHAINS = `
SELECT retailchainid, name FROM retailchains
ORDER BY CHAR_LENGTH(name) DESC`

const SQL_SELECT_BY_PLACEIDS = `
SELECT placeid, retailchainid FROM supermarkets
WHERE placeid IN `

const SQL_SELECT_BY_EAN = `
SELECT s.placeid, s.retailchainid FROM availableproducts ap
JOIN supermarkets s
ON s.placeid = ap.supermarketid
WHERE ap.ean = ?
`

const SQL_INSERT_SUPERMARKETS = "INSERT INTO supermarkets (placeid, retailchainid) VALUES "

const fetchRetailChains = () => cache.wrap("fetchRetailChains", async function() {
  const [ retailChains ] = await db.query(SQL_SELECT_RETAILCHAINS)
  return retailChains
})

async function fetchByPlaces (places) {
  const data = places.map(({ placeid }) => `'${placeid}'`)
  const query = SQL_SELECT_BY_PLACEIDS + "(" + data.join(", ") + ")"
  const [ supermarkets ] = await db.query(query)
  return supermarkets
}

async function insertSupermarkets (supermarkets) {
  const data = supermarkets
    .map(({ placeid, retailchainid }) => `('${placeid}', ${retailchainid})`)
  const query = SQL_INSERT_SUPERMARKETS + data.join(", ")
  await db.query(query)
}

async function filterNewPlaces(places, retailchains) {
  let newPlaces = places.filter(place => !place.retailchainid)
  for (const place of newPlaces) {
    place.retailchainid = await gmapsService.fetchPlaceRetailChain(place, retailchains)
  }
  newPlaces = newPlaces.filter(place => place.retailchainid)
  return newPlaces
}

module.exports.fetchNearbySupermarkets = (lat, lng) =>
  cache.wrap(`fetchNearbySupermarkets-${lat}-${lng}`, async function() {
    let retailchains = await fetchRetailChains()

    let places = (await gmapsService.fetchNearbySupermarkets(lat, lng))
      .slice(0, 10)
    const placesInDb = await fetchByPlaces(places)

    const placeRetailchainid = {}
    for (const { placeid, retailchainid } of placesInDb) {
      placeRetailchainid[placeid] = retailchainid
    }

    for (const place of places) {
      place.retailchainid = placeRetailchainid[place.placeid]
    }

    const newPlaces = await filterNewPlaces(places, retailchains)

    if (newPlaces.length > 0) {
      // Don't wait for the insert to end before finishing the request
      insertSupermarkets(newPlaces)
        .catch(console.error)
    }

    const supermarkets = places.filter(place => place.retailchainid)

    return supermarkets
  })
