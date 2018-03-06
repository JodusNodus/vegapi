const express = require("express")

const { execute } = require("app/executor")
const productsService = require("app/service/products")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function(req) {
  const { categoryid, offset, size, searchquery } = req.query
  const params = {
    searchquery,
    categoryid: categoryid ? parseInt(categoryid) : undefined,
    offset: offset ? parseInt(offset) : 0,
    size: size ? parseInt(size) : 10
  }
  return await productsService.fetchAll(params)
}))

router.post("/", execute(async function(req) {
  const { name, ean, categoryid, brandid } = req.body
  const product = {
    ean: Buffer.from(ean, "hex"),
    name,
    categoryid: parseInt(categoryid),
    brandid: Buffer.from(brandid, "hex"),
    creationdate: new Date()
  }
  return await productsService.insertProduct(product)
}))

router.get("/:ean", execute(async function(req) {
  const ean = req.params.ean
  return await productsService.fetchProduct(ean)
}))

module.exports = router
