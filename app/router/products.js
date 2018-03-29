const express = require("express")
const { check, oneOf } = require("express-validator/check")
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
const gvisionService = require("app/service/gvision")
const storageService = require("app/service/storage")

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
	check("searchquery").exists().isLength({ min: 3 }),
	sanitize("offset").toInt(),
	sanitize("size").toInt()
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

router.post("/picture", [
	pictureService.upload.single("picture")
], execute(async function(req) {
  const userid = req.user.userid
  const ean = parseInt(req.body.ean)
  if (isNaN(ean) || !req.file) {
    throw httpStatus.BAD_REQUEST
  }
  if (await productsService.fetchProduct(ean, userid)) {
    throw httpStatus.BAD_REQUEST
  }
  const picture = await pictureService.process(req.file)
  const coverBuffer = await pictureService.coverBuffer(picture)
  const { safe, labelSuggestions, brandSuggestions } = await gvisionService.getImageSuggestions(coverBuffer)
  if (!safe) {
    throw new Error("Adult, violent or racy pictures are not allowed. If this is not the case please try taking another picture.")
  }

  // Do work but send request back
  (async function() {
    const thumbBuffer = await pictureService.thumbBuffer(picture)
    storageService.uploadPicture(`thumb-${ean}`, thumbBuffer)
    storageService.uploadPicture(`cover-${ean}`, coverBuffer)
  })()

  return { labelSuggestions, brandSuggestions }
}))


router.post("/", [
  check("name").exists(),
  check("ean").isInt(),
	oneOf([
		check("brandid").isInt(),
		check("brandname").exists(),
	]),
  check("labels").exists(),
  sanitize("ean").toInt(),
  sanitize("brandid").toInt(),
], execute(async function(req) {
  let { name, ean, brandid, brandname, labels="" } = req.body
  labels = labels.split(";")

  let labelIds = []
  if (labels.length > 0) {
    labelIds = await labelsService.insertLabels(newLabels)
  }

  await labelsService.addProductLabels(ean, labelIds)

  if (!brandid && brandname) {
    brandid = await brandsService.insertBrand(brandname)
  }

  const product = {
    ean,
    name,
    brandid,
    creationdate: new Date(),
    userid: req.user.userid
  }

  await productsService.insertProduct(product)
}))

router.get("/:ean", [
  check("ean").isInt(),
  sanitize("ean").toInt(),
], execute(async function(req) {
  const loc = req.session.location
  const userid = req.user.userid
  const ean = req.params.ean

  const product = await productsService.fetchProduct(ean, userid)
  if (!product) {
    throw httpStatus.NOT_FOUND
  }

  const supermarkets = await supermarketsService.fetchNearbySupermarkets(loc.lat, loc.lng)
  const labels = await labelsService.fetchProductLabels(ean)
  const thumbPicture = `https://storage.googleapis.com/vegstorage/thumb-${ean}`
  const coverPicture = `https://storage.googleapis.com/vegstorage/cover-${ean}`
  return { thumbPicture, coverPicture, product, supermarkets, labels }
}))


router.post("/:ean/rate", [
  check("ean").isInt(),
  sanitize("ean").toInt(),
  check("rating").isInt({ min: 0, max: 5 }),
  sanitize("rating").toInt()
], execute(async function(req) {
	const { rating } = req.body
  const userid = req.user.userid
  const ean = req.params.ean

  try {
    await userRatingsService.addRating(userid, ean, rating)
  } catch(err) {
    // User has already rated this product
  }
}))

router.delete("/:ean", [
  check("ean").isInt(),
  sanitize("ean").toInt()
], execute(async function(req) {
  const userid = req.user.userid
  const ean = req.params.ean

  try {
    await userCorrectionsService.addCorrection(userid, ean)
  } catch(err) {
    // User has already given a correction on this product
  }

  // Check amount of corrections and respond accordingly
}))

module.exports = router
