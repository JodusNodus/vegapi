const express = require("express")

const { execute } = require("app/executor")
const gmapsService = require("app/service/gmaps")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

async function filterNewPlaces(places, retailchains) {
  let newPlaces = places.filter(place => !place.retailchainid)
  for (const place of newPlaces) {
    place.retailchainid = await gmapsService.fetchPlaceRetailChain(place, retailchains)
  }
  newPlaces = newPlaces.filter(place => place.retailchainid)
  return newPlaces
}

router.get("/", execute(async function(req) {
  const { lat, lng } = req.query

  let retailchains = await supermarketsService.fetchRetailChains()

  let places = (await gmapsService.fetchNearbySupermarkets(lat, lng))
    .slice(0, 10)
  const placesInDb = await supermarketsService.fetchByPlaces(places)

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
    supermarketsService.insertSupermarkets(newPlaces)
      .catch(console.error)
  }

  const supermarkets = places.filter(place => place.retailchainid)

	return { supermarkets, params: { lat, lng } }
}))


module.exports = router
