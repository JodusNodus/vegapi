const express = require("express")

const { execute } = require("app/executor")
const gmapsService = require("app/service/gmaps")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function(req) {
  const loc = req.session.location
  const supermarkets = await supermarketsService.fetchNearbySupermarkets(loc.lat, loc.lng)
  return { supermarkets }
}))

module.exports = router
