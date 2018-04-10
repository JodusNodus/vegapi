const _     = require("lodash")
const mysql = require("mysql2-promise")()

const args       = require("app/args")
const configUtil = require("app/config-util")
const logger     = require("app/logger").getLogger("va.db")


/**
 * @type {Pool|null}
 */
let mPool = null

/**
 * start - Try to initialize the database connection pool!
 *
 * @param {object} settings the settings instance.
 */
module.exports.start = function (settings) {
  if (!mPool) {
    logger.info("create connection pool.")
    const connection = {
      user: configUtil.getSetting(settings, "db.user", "root"),
      password: configUtil.getSetting(settings, "db.password", "test1234"),
      database: configUtil.getSetting(settings, "db.database", ""),
    }

    const instance = configUtil.getSetting(settings, "db.instance")
    if (instance && process.env.NODE_ENV === 'production') {
      connection.socketPath = `/cloudsql/${instance}`
    } else {
      connection.host = configUtil.getSetting(settings, "db.host", "localhost")
      connection.port = configUtil.getSetting(settings, "db.port", 3306)
    }

    const knex = require("knex")({
      client: "mysql2",
      connection,
      acquireConnectionTimeout: 10000,
      pool: {
        afterCreate: function (conn, done) {
          logger.info("Connection pool is started successful...")
          done()
        }
      },
    });
    module.exports.knex = knex

    require("app/shutdown").addListener(function (name) {
      if (knex) {
        knex.destroy(() => {})
      }
      logger.info("pool is shutdown. Reason of \"", name, "\"...")
    })
  }
}
