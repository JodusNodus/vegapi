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

const SQL_INSERT = "INSERT INTO labels (name) VALUES (?)"

const SQL_INSERT_PRODUCT_LABELS = "INSERT INTO productlabels (ean, labelid) VALUES (?, ?)"

module.exports.fetchAll = async function (options) {
  const [ labels ] = await db.query(SQL_SELECT_ALL)
  return labels
}

module.exports.fetchProductLabels = async function (ean) {
  const [ labels ] = await db.execute(SQL_SELECT_PRODUCT, [ ean ])
  return labels
}

module.exports.insertLabels = async function (labels) {
  const ids = []
  for (const label of labels) {
    const [ result ] = await db.execute(SQL_INSERT, [ label ])
    ids.push(result.insertId)
  }
  return ids
}

module.exports.addProductLabels = async function (ean, labelIds) {
  for (const id of labelIds) {
    await db.execute(SQL_INSERT_PRODUCT_LABELS, [ ean, id ])
  }
}
