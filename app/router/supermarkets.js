const express = require("express")

const { execute } = require("app/executor")
const gmapsService = require("app/service/gmaps")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function(req) {
	const size = 5
  const { lat, lng } = req.query
  let supermarkets = await gmapsService.fetchNearbySupermarkets(lat, lng)
	supermarkets = supermarkets.slice(0, size)
	return { supermarkets }
}))


module.exports = router
