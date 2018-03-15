const cacheManager = require("cache-manager")

const cache = cacheManager.caching({store: "memory", max: 100, ttl: 60 * 60})

module.exports = cache
// module.exports.wrap = (key, afn, options={}) => async function() {
//   return await cache.wrap(key, options, () => afn.apply(null, arguments))
// }

