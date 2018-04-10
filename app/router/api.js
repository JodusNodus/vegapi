const express = require("express")

const routerProducts = require("./products")
const routerLocation = require("./location")
const routerSupermarkets = require("./supermarkets")
const routerBrands = require("./brands")
const routerLabels = require("./labels")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.use(function(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.status(401)
    res.send()
  }
})

router.use("/products", routerProducts)
router.use("/location", routerLocation)
router.use("/supermarkets", routerSupermarkets)
router.use("/brands", routerBrands)
router.use("/labels", routerLabels)

module.exports = router
