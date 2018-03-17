const express = require("express")
const geolib = require("geolib")
const { check } = require("express-validator/check")
const { matchedData, sanitize } = require("express-validator/filter")

const { execute } = require("app/executor")
const productsService = require("app/service/products")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

const formatGeolibLoc = ({ lat, lng }) => ({latitude: lat, longitude: lng})

router.post("/", [
  check("lat").isFloat(),
  check("lng").isFloat(),
  sanitize("lat").toFloat(),
  sanitize("lng").toFloat()
], execute(async function(req) {

  const oldLoc = req.session.location
  const newLoc = matchedData(req)

  if (oldLoc) {
    if (oldLoc.lat == newLoc.lat && oldLoc.lng == newLoc.lng) {
      return
    }
    const distance = geolib.getDistance(
      formatGeolibLoc(oldLoc),
      formatGeolibLoc(newLoc),
      20 // accuracy in meters
    )
    if (distance <= 300) {
      return
    }
  }
  req.session.location = newLoc

  // Prefetch & cache supermarkets in area
  supermarketsService.fetchNearbySupermarkets(newLoc.lat, newLoc.lng)
    .catch(console.error)
}))

module.exports = router
