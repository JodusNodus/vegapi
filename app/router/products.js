const express = require("express")

const { execute } = require("app/executor")
const productsService = require("app/service/products")
const pictureService = require("app/service/product-picture")
const supermarketsService = require("app/service/supermarkets")
const userCorrectionsService = require("app/service/user-corrections")

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

router.get("/", execute(async function(req) {
  const { offset, size, searchquery } = req.query
  const params = {
    searchquery,
    offset: offset ? parseInt(offset) : 0,
    size: size ? parseInt(size) : 10
  }
  return await productsService.fetchAll(params)
}))

router.post("/", pictureService.upload.single("picture"), execute(async function(req) {
  const { name, ean, brandid } = req.body
  const product = {
    ean: Buffer.from(ean, "hex"),
    name,
    brandid: parseInt(brandid),
    creationdate: new Date(),
    userid: Buffer.from(req.user.userid, "hex")
  }

  await productsService.insertProduct(product)

  const picture = await pictureService.process(req.file)
  await pictureService.writeCover(picture, ean)
  await pictureService.writeThumb(picture, ean)
}))

router.get("/:ean", execute(async function(req) {
  const loc = req.session.location
  const userid = Buffer.from(req.user.userid, "hex")
  const ean = req.params.ean

  const { product } = await productsService.fetchProduct(ean, userid)
  const supermarkets = await supermarketsService.fetchNearbySupermarkets(loc.lat, loc.lng)
  return { product, supermarkets }
}))

router.delete("/:ean", execute(async function(req) {
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
