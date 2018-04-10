const _ = require("lodash")
const args = require("app/args")
const cache = require("app/cache")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")
const gmapsService = require("app/service/gmaps")

const fetchRetailChains = () => cache.wrap("fetchRetailChains", async function() {
  const retailChains = await knex("retailchains")
    .select("retailchainid", "name")
    .orderByRaw("CHAR_LENGTH(name) DESC")
  return retailChains
})

async function fetchByPlaces (places) {
  const placeids = places.map(place => place.placeid)
  const supermarkets = await knex("supermarkets")
    .select("placeid", "retailchainid")
    .whereIn("placeid", placeids)
  return supermarkets
}

async function insertSupermarkets (supermarkets) {
  const rows = supermarkets.map(({ placeid, retailchainid }) => ({ placeid, retailchainid }))
  await knex("supermarkets").insert(rows)
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

    const supermarkets = places
      .filter(place => place.retailchainid)
      .map(place => Object.assign(place, {
        retailchainid: undefined,
        retailchain: retailchains.find(chain => chain.retailchainid === place.retailchainid)
      }))

    return supermarkets
  })
