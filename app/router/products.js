const express = require("express")

const { execute } = require("app/executor")
const productsService = require("app/service/products")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.use(function(req, res, next) {
  if (req.session.location) {
    next()
  } else {
    res.status(400)
    res.send("Location has not been set for the session")
  }
})

router.get("/", execute(async function(req) {
  const { offset, size, searchquery } = req.query
  const params = {
    searchquery,
    offset: offset ? parseInt(offset) : 0,
    size: size ? parseInt(size) : 10
  }
  return await productsService.fetchAll(params)
}))

router.post("/", execute(async function(req) {
  const { name, ean, brandid } = req.body
  const product = {
    ean: Buffer.from(ean, "hex"),
    name,
    brandid: parseInt(brandid),
    creationdate: new Date(),
    userid: Buffer.from(req.user.userid, "hex")
  }
  return await productsService.insertProduct(product)
}))

router.get("/:ean", execute(async function(req) {
  const loc = req.session.location
  const ean = req.params.ean

  const { product } = await productsService.fetchProduct(ean)
  const supermarkets = await supermarketsService.fetchNearbySupermarkets(loc.lat, loc.lng)
  return { product, supermarkets }
}))

module.exports = router
