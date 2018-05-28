const util = require("util");
const fs = require("fs");
const _ = require("lodash");
const fetch = require("node-fetch");
const brandsService = require("app/service/brands");
const { BUCKET_NAME } = require("app/service/storage");

const settings = require("../../settings.prod.json");
const API_KEY = settings.gcloud.apiKey;

function isSafe({ adult, violence, racy }) {
  const prop = [adult, violence, racy].find(
    prop => prop === "LIKELY" || prop === "VERY_LIKELY"
  );
  return !prop;
}

module.exports.getImageSuggestions = async function(ean) {
  const body = {
    requests: [
      {
        image: { source: { imageUri: `gs://${BUCKET_NAME}/cover-${ean}` } },
        features: [
          { type: "LABEL_DETECTION" },
          { type: "WEB_DETECTION" },
          { type: "SAFE_SEARCH_DETECTION" }
        ]
      }
    ]
  };

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
  const req = await fetch(url, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const { responses } = await req.json();
  const { webDetection, labelAnnotations, safeSearchAnnotation } = responses[0];

  const result = {};
  result.safe = isSafe(safeSearchAnnotation);
  if (!result.safe) {
    return result;
  }

  result.labelSuggestions = labelAnnotations
    .map(x => x.description)
    .map(s => s.toLowerCase());
  result.labelSuggestions = _.uniq(result.labelSuggestions);

  const possibleBrandNames = webDetection.webEntities
    .map(x => x.description)
    .filter(s => s)
    .map(s => s.toLowerCase());

  if (possibleBrandNames.length > 0) {
    result.brandSuggestions = await brandsService.findWithNames(
      possibleBrandNames
    );
  }

  return result;
};
