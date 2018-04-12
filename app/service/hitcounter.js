const { increment, decrement, get } = require("app/cache")

module.exports.hitProduct = async function(ean) {
  await increment(`hitcounter-${ean}`, 1, { initial: 1, expires: 60 * 60 * 24 * 30 /* 1 month */ })
}

module.exports.getProductHits = async function(ean) {
  try {
    const count = await get(`hitcounter-${ean}`)
    return count ? parseInt(count.toString()) : 0
  } catch (e) {
    return 0
  }
}
