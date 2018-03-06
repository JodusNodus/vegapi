const express = require("express")

const { execute } = require("app/executor")
const productsService = require("app/service/products")

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function(req) {
  return await productsService.fetchAll(req.query)
}))

router.get("/:ean", execute(async function(req) {
  const ean = req.params.ean
  return await productsService.fetchProduct(ean)
}))

module.exports = router
