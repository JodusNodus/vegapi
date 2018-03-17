const express = require("express")
const { check, validationResult } = require("express-validator/check")

const httpStatus = require("app/http-status")
const pictureService = require("app/service/product-picture")

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

const routeMiddleware = [ check("ean").isHexadecimal() ]
const routeImage = getStreamFunc => async function(req, res) {
  if (!validationResult(req).isEmpty()) {
    res.status(httpStatus.BAD_REQUEST)
    res.send()
    return
  }
  try {
    let ean = Buffer
      .from(req.params.ean, "hex")
      .toString("hex")
    res.setHeader("Content-Type", "image/jpeg")
    const stream = await getStreamFunc(ean)
    stream.pipe(res)
  } catch (err) {
    res.status(httpStatus.NOT_FOUND)
    res.send()
  }
}

router.get("/covers/:ean", routeMiddleware, routeImage(pictureService.getCoverStream))
router.get("/thumbnails/:ean", routeMiddleware, routeImage(pictureService.getThumbStream))

module.exports = router
