const express = require("express")

const { execute } = require("app/executor")
const brandsService = require("app/service/brands")

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function () {
  return await brandsService.fetchAll()
}))

router.post("/", execute(async function (req) {
  const { name } = req.body
  await brandsService.insertBrand(name)
}))

module.exports = router
