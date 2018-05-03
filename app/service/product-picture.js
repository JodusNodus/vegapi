const os = require("os");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

const upload = multer({ dest: os.tmpdir() });

module.exports.upload = upload;

module.exports.process = file =>
  sharp(file.path)
    .trim()
    .rotate()
    .normalise()
    .jpeg({
      quality: 65
    });

module.exports.coverBuffer = picture => picture.resize(400, 300).toBuffer();

module.exports.thumbBuffer = picture => picture.resize(200, 150).toBuffer();

const getStream = (ean, baseDir) =>
  new Promise((res, rej) => {
    const file = path.join(baseDir, ean);
    fs.exists(file, exists => {
      if (exists) {
        res(fs.createReadStream(file));
      } else {
        rej();
      }
    });
  });

module.exports.getCoverStream = ean => getStream(ean, COVER_DIR);

module.exports.getThumbStream = ean => getStream(ean, THUMB_DIR);
