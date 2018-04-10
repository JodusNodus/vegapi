const _ = require("lodash")
const args = require("app/args")
const { knex } = require("app/db")
const logger = require("app/logger").getLogger("va.service")

const SQL_SELECT_ALL = "SELECT labelid, name FROM labels"
const SQL_SELECT_PRODUCT = `
SELECT l.* FROM productlabels pl
JOIN labels l
ON l.labelid = pl.labelid
WHERE pl.ean = ?
`

const SQL_INSERT = "INSERT INTO labels (name) VALUES (?)"

const SQL_INSERT_PRODUCT_LABELS = "INSERT INTO productlabels (ean, labelid) VALUES (?, ?)"

module.exports.fetchAll = async function (options) {
  const labels = await knex("labels")
    .select("labelid", "name")
  return labels
}

module.exports.fetchProductLabels = async function (ean) {
  const labels = await knex("productlabels")
    .select("labels.labelid", "labels.name")
    .join("labels", "labels.labelid", "productlabels.labelid")
    .where({ ean })
  return labels
}

module.exports.fetchLabelsWithName = async function (labelnames) {
  const labels = await knex("labels")
    .select("labelid", "name")
    .whereIn("name", labelnames)
  return labels
}

module.exports.insertLabels = async function (labels) {
  const rows = labels.map(name => ({ name }))
  const chunkSize = 30;
  const ids = await knex.batchInsert("labels", rows, chunkSize)
    .returning("labelid")

  return ids
}

module.exports.addProductLabels = async function (ean, labelIds) {
  const rows = labelIds.map(labelid => ({ labelid, ean }))
  const chunkSize = 30;
  await knex.batchInsert("productlabels", rows, chunkSize)
}
