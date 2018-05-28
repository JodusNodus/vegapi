const queryString = require("query-string");
const _ = require("lodash");
const fetch = require("node-fetch");
const supermarketsService = require("./supermarkets");
const cache = require("app/cache");

const settings = require("../../settings.prod.json");
const API_KEY = settings.gcloud.apiKey;

const RADIUS = 200;

const normalizeName = name => name.toLowerCase().replace(/[^a-z0-9]/g, "");

function findRetailChain(placeName, retailchains) {
  placeName = normalizeName(placeName);
  return retailchains.find(
    ({ name }) => placeName.indexOf(normalizeName(name)) > -1
  );
}

const isLikelyASupermarket = name =>
  /proxy|ad|supermarket|express/gi.test(name);

module.exports.fetchPlaceRetailChain = async function(place, retailchains) {
  let retailChain = findRetailChain(place.name, retailchains);

  if (!retailChain && isLikelyASupermarket(place.name)) {
    const website = await fetchPlaceWebsite(place.placeid);
    if (website) {
      retailChain = findRetailChain(website, retailchains);
    }
  }

  return retailChain && retailChain.retailchainid;
};

const fetchPlaceWebsite = placeid =>
  cache.wrap(`fetchPlaceWebsite-${placeid}`, async function() {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeid}&key=${API_KEY}`;
    const req = await fetch(url);
    const { result } = await req.json();
    return result.website;
  });

module.exports.fetchNearbySupermarkets = async function(lat, lng) {
  const querystr = queryString.stringify({
    key: API_KEY,
    keyword: "supermarket",
    // radius: RADIUS,
    rankby: "distance",
    location: `${lat},${lng}`,
    language: "nl",
    type: "supermarket"
  });
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${querystr}`;
  const req = await fetch(url);
  const { results } = await req.json();
  const places = results.map(place => ({
    placeid: place.place_id,
    name: place.name,
    address: place.vicinity
  }));
  return places;
};
