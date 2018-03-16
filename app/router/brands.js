const express = require("express")

const { execute } = require("app/executor")
const brandsService = require("app/service/brands")

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function () {
  const brands = await brandsService.fetchAll()
  return { brands }
}))

module.exports = router
