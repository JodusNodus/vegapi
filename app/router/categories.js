const express = require("express")

const { execute } = require("app/executor")
const categoriesService = require("app/service/categories")

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function () {
  return await categoriesService.fetchAll()
}))

module.exports = router
