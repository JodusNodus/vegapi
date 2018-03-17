const express = require("express")
const { check } = require("express-validator/check")
const { matchedData, sanitize } = require("express-validator/filter")

const httpStatus = require("app/http-status")
const { execute } = require("app/executor")
const productsService = require("app/service/products")
const pictureService = require("app/service/product-picture")
const supermarketsService = require("app/service/supermarkets")
const userCorrectionsService = require("app/service/user-corrections")
const userRatingsService = require("app/service/user-ratings")
const labelsService = require("app/service/labels")
const brandsService = require("app/service/brands")

const router = express.Router({
  mergeParams: true,
  strict: true
})

router.use(function(req, res, next) {
  if (req.session.location) {
    next()
  } else {
    res.status(400)
    res.send("Location has not been set for the session")
  }
})

router.get("/", [
	check("searchquery").exists().isLength({ min: 4 }),
	sanitize("offset").toInt(),
	sanitize("size").toInt(),
], execute(async function(req) {
  const { offset, size, searchquery } = req.query
  const params = {
    searchquery,
    offset: offset ? parseInt(offset) : 0,
    size: size ? parseInt(size) : 10
  }
  const products = await productsService.fetchAll(params)
  return { products, params }
}))

router.post("/", pictureService.upload.single("picture"), execute(async function(req) {
  let { name, ean, brandid, brandname, labels="" } = req.body
  ean = Buffer.from(ean, "hex")

  labels = labels.split(";")
  const newLabels = labels
    .filter(s => isNaN(new Number(s)))

  if (newLabels.length > 0) {
    const newLabelIds = await labelsService.insertLabels(newLabels)
  }

  let labelIds = labels
    .map(s => new Number(s))
    .filter(x => !isNaN(x))
    .concat(newLabelIds)

  await labelsService.addProductLabels(ean, labelIds)

  brandid = parseInt(brandid)
  if (isNaN(brandid) && brandname) {
    brandid = await brandsService.insertBrand(brandname)
  }

  const product = {
    ean,
    name,
    brandid,
    creationdate: new Date(),
    userid: Buffer.from(req.user.userid, "hex")
  }

  await productsService.insertProduct(product)

  if (req.file) {
    const picture = await pictureService.process(req.file)
    await pictureService.writeCover(picture, req.body.ean)
    await pictureService.writeThumb(picture, req.body.ean)
  }
}))

router.get("/:ean", [
  check("ean").isHexadecimal()
], execute(async function(req) {
  const loc = req.session.location
  const userid = Buffer.from(req.user.userid, "hex")
  const ean = Buffer.from(req.params.ean, "hex")

  const product = await productsService.fetchProduct(ean, userid)
  if (!product) {
    throw httpStatus.NOT_FOUND
  }

  const supermarkets = await supermarketsService.fetchNearbySupermarkets(loc.lat, loc.lng)
  const labels = await labelsService.fetchProductLabels(ean)
  return { product, supermarkets, labels }
}))


router.post("/:ean/rate", [
  check("ean").isHexadecimal(),
  check("rating").isInt({ min: 0, max: 5 }),
  sanitize("rating").toInt()
], execute(async function(req) {
	const { rating } = req.body
  const userid = Buffer.from(req.user.userid, "hex")
  const ean = Buffer.from(req.params.ean, "hex")

  try {
    await userRatingsService.addRating(userid, ean, rating)
  } catch(err) {
    // User has already rated this product
  }
}))

router.delete("/:ean", [
  check("ean").isHexadecimal()
], execute(async function(req) {
  const userid = Buffer.from(req.user.userid, "hex")
  const ean = Buffer.from(req.params.ean, "hex")

  try {
    await userCorrectionsService.addCorrection(userid, ean)
  } catch(err) {
    // User has already given a correction on this product
  }

  // Check amount of corrections and respond accordingly
}))

module.exports = router
