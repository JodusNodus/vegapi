const _ = require("lodash")
const args = require("app/args")
const db = require("mysql2-promise")()
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT * FROM labels"
const SQL_SELECT_PRODUCT = `
SELECT l.* FROM productlabels pl
JOIN labels l
ON l.labelid = pl.labelid
WHERE pl.ean = ?
`

module.exports.fetchAll = async function (options) {
  const [ labels ] = await db.query(SQL_SELECT_ALL)
  return { labels }
}

module.exports.fetchProductLabels = async function (ean) {
  const [ labels ] = await db.execute(SQL_SELECT_PRODUCT, [ ean ])
  return labels
}
