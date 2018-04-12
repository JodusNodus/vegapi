const express = require("express")
const { execute } = require("app/executor")
const productsService = require("app/service/products")
const hitcounterService = require("app/service/hitcounter")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.use(function(req, res, next) {
  if (req.headers["x-appengine-cron"] == "true") {
    next()
  } else {
    res.status(400)
    res.send()
  }
})

router.get("/producthits", execute(async function(req) {
  const eans = await productsService.fetchAllEans()
  for (const ean of eans) {
    const hits = await hitcounterService.getProductHits(ean)
    await productsService.updateProductHits(ean, hits)
  }
}))

module.exports = router
