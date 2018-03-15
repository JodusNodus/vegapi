const express = require("express")

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

const routeImage = getStreamFunc => async function(req, res) {
  try {
    const { ean } = req.params
    res.setHeader("Content-Type", "image/jpeg")
    getStreamFunc(ean).pipe(res)
  } catch (err) {
    res.sendStatus(404)
  }
}

router.get("/covers/:ean", routeImage(pictureService.getCoverStream))
router.get("/thumbnails/:ean", routeImage(pictureService.getThumbStream))

module.exports = router
