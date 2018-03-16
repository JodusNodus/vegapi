const express = require("express")

const { execute } = require("app/executor")
const labelsService = require("app/service/labels")

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
})

router.get("/", execute(async function () {
  const labels = await labelsService.fetchAll()
  return { labels }
}))

module.exports = router
