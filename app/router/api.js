const express = require("express")

const routerProducts = require("./products")
const routerCategories = require("./categories")

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
router.use("/categories", routerCategories)

module.exports = router
