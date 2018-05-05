const express = require("express");
const { check, oneOf } = require("express-validator/check");
const { matchedData, sanitize } = require("express-validator/filter");

const httpStatus = require("app/http-status");
const { execute } = require("app/executor");
const productsService = require("app/service/products");
const pictureService = require("app/service/product-picture");
const supermarketsService = require("app/service/supermarkets");
const userCorrectionsService = require("app/service/user-corrections");
const userRatingsService = require("app/service/user-ratings");
const labelsService = require("app/service/labels");
const brandsService = require("app/service/brands");
const gvisionService = require("app/service/gvision");
const storageService = require("app/service/storage");
const hitcounterService = require("app/service/hitcounter");

const router = express.Router({
  mergeParams: true,
  strict: true
});

router.use(function(req, res, next) {
  if (req.session.location) {
    next();
  } else {
    res.status(400);
    res.send("Location has not been set for the session");
  }
});

router.get(
  "/",
  [
    check("searchquery")
      .optional()
      .isLength({ min: 3 }),
    check("orderby")
      .optional()
      .isIn(["creationdate", "rating", "hits", "none"]),
    check("labels").optional(),
    check("size")
      .optional()
      .isInt({ min: 1, max: 40 }),
    check("page")
      .optional()
      .isInt({ min: 1 }),
    sanitize("page").toInt(),
    sanitize("size").toInt()
  ],
  execute(async function(req) {
    let {
      page = 1,
      size = 10,
      searchquery,
      orderby = "none",
      labels
    } = req.query;
    if (labels) {
      labels = labels.split(";");
    } else {
      labels = [];
    }

    let { total, products } = await productsService.paginateAll({
      size,
      page,
      searchquery,
      orderby,
      labels
    });

    products = products.map(product =>
      Object.assign(product, {
        thumbPicture: storageService.getThumbURL(product.ean)
      })
    );
    return { products, page, size, total };
  })
);

router.get(
  "/:ean",
  [check("ean").isInt(), sanitize("ean").toInt()],
  execute(async function(req) {
    const loc = req.session.location;
    const userid = req.user.userid;
    const ean = req.params.ean;

    const product = await productsService.fetchProduct(ean, userid);
    if (!product) {
      throw httpStatus.NOT_FOUND;
    }

    product.hits = await hitcounterService.getProductHits(ean);
    product.labels = await labelsService.fetchProductLabels(ean);
    product.thumbPicture = storageService.getThumbURL(ean);
    product.coverPicture = storageService.getCoverURL(ean);
    product.supermarkets = await supermarketsService.fetchByProductNearby(
      ean,
      loc.lat,
      loc.lng
    );

    hitcounterService.hitProduct(ean);

    return { product };
  })
);

router.post(
  "/picture",
  [pictureService.upload.single("picture")],
  execute(async function(req) {
    const userid = req.user.userid;
    const ean = parseInt(req.body.ean);
    if (isNaN(ean) || !req.file) {
      throw httpStatus.BAD_REQUEST;
    }
    if (await productsService.productExists(ean)) {
      throw httpStatus.BAD_REQUEST;
    }
    const picture = await pictureService.process(req.file);
    const coverBuffer = await pictureService.coverBuffer(picture);
    await storageService.uploadPicture(`cover-${ean}`, coverBuffer);
    const {
      safe,
      labelSuggestions,
      brandSuggestions
    } = await gvisionService.getImageSuggestions(ean);
    if (!safe) {
      throw new Error(
        "Adult, violent or racy pictures are not allowed. If this is not the case please try taking another picture."
      );
    }

    // Do work but send request back
    (async function() {
      const thumbBuffer = await pictureService.thumbBuffer(picture);
      await storageService.uploadPicture(`thumb-${ean}`, thumbBuffer);
    })();

    return { labelSuggestions, brandSuggestions };
  })
);

router.post(
  "/",
  [
    check("ean").isInt(),
    check("name").optional(),
    check("brandname").optional(),
    check("labels").optional(),
    check("placeid").exists(),
    sanitize("ean").toInt()
  ],
  execute(async function(req) {
    const userid = req.user.userid;
    let { name, ean, brandname, placeid, labels: labelNames } = req.body;

    const productExists = await productsService.productExists(ean);

    if (!productExists && !(await storageService.exists(`cover-${ean}`))) {
      throw httpStatus.BAD_REQUEST;
    }
    if (!(await supermarketsService.exists(placeid))) {
      throw httpStatus.BAD_REQUEST;
    }

    if (productExists) {
      await supermarketsService.addProductToSupermarket(ean, placeid);
      return;
    }

    if (!name || !brandname || !labelNames) {
      throw httpStatus.BAD_REQUEST;
      return;
    }

    const brand = await brandsService.fetchWithName(brandname);
    let brandid;
    if (brand) {
      brandid = brand.brandid;
    } else {
      brandid = await brandsService.insertBrand(brandname);
    }

    const labels = await labelsService.fetchLabelsWithName(labelNames);

    let labelIds = labels.map(label => label.labelid);

    const newLabelNames = labelNames.filter(
      str => !labels.find(label => label.name == str)
    );
    if (newLabelNames.length > 0) {
      const newLabelIds = await labelsService.insertLabels(newLabelNames);
      labelIds = labelIds.concat(newLabelIds);
    }

    const product = {
      ean,
      name,
      brandid,
      creationdate: new Date(),
      userid
    };
    await productsService.insertProduct(product);

    await labelsService.addProductLabels(ean, labelIds);

    await supermarketsService.addProductToSupermarket(ean, placeid);
  })
);

router.post(
  "/:ean/rate",
  [
    check("ean").isInt(),
    sanitize("ean").toInt(),
    check("rating").isInt({ min: 0, max: 5 }),
    sanitize("rating").toInt()
  ],
  execute(async function(req) {
    const { rating } = req.body;
    const userid = req.user.userid;
    const ean = req.params.ean;

    try {
      await userRatingsService.addRating(userid, ean, rating);
    } catch (err) {
      // User has already rated this product
    }
  })
);

router.delete(
  "/:ean",
  [check("ean").isInt(), sanitize("ean").toInt()],
  execute(async function(req) {
    const userid = req.user.userid;
    const ean = req.params.ean;

    try {
      await userCorrectionsService.addCorrection(userid, ean);
    } catch (err) {
      // User has already given a correction on this product
    }
  })
);

module.exports = router;
