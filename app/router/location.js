const express = require("express")
const geolib = require("geolib")

const { execute } = require("app/executor")
const productsService = require("app/service/products")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

const formatGeolibLoc = ({ lat, lng }) => ({latitude: lat, longitude: lng})

router.post("/", execute(async function(req) {
  const { lat, lng } = req.body
  const oldLoc = req.session.location
  const newLoc = {
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  }
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
