const path = require("path")
const fs = require("fs")
const multer  = require("multer")
const sharp  = require("sharp")

const TMP_DIR = "storage/tmp"
const COVER_DIR = "storage/covers"
const THUMB_DIR = "storage/thumbnails"

const upload = multer({ dest: TMP_DIR })

module.exports.upload = upload

module.exports.process = (file) => sharp(file.path)
  .trim()
  .rotate()
  .normalise()
  .jpeg({
    quality: 70
  })

module.exports.writeCover = (picture, ean) => picture
  .resize(320, 240)
  .toFile(path.join(COVER_DIR, ean))
  
module.exports.writeThumb = (picture, ean) => picture
  .resize(100, 75)
  .toFile(path.join(THUMB_DIR, ean))

module.exports.getCoverStream = (ean) => fs.createReadStream(path.join(COVER_DIR, ean))

module.exports.getThumbStream = (ean) => fs.createReadStream(path.join(THUMB_DIR, ean))
