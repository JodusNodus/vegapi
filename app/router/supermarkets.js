const express = require("express")

const { execute } = require("app/executor")
const gmapsService = require("app/service/gmaps")
const supermarketsService = require("app/service/supermarkets")

const router = express.Router({
  mergeParams: true,
  strict: true
})

module.exports = router
