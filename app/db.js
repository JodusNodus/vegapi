/*
 * vegapi - https://github.com/jodusnodus/vegapi.git
 *
 * Copyright (c) 2018 JodusNodus
 */

/**
 * Handle all database manipulations
 *
 * @module va/db
 *
 * @requires lodash
 * @requires mysql
 * @requires q
 * @requires module:va/args
 * @requires module:va/config-util
 * @requires module:va/logger
 */

"use strict"

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
    mPool = mysql.configure({
      namedPlaceholders: true,
      host:     configUtil.getSetting(settings, "db.host", "localhost"),
      port:     configUtil.getSetting(settings, "db.port", 3306),
      user:     configUtil.getSetting(settings, "db.user", "root"),
      password: configUtil.getSetting(settings, "db.password", "test1234"),
      database: configUtil.getSetting(settings, "db.database", ""),
      connectionLimit: configUtil.getSetting(settings, "db.connectionLimit", 10),
      queryFormat: function (query, values) {
        if (!values) {
          // without a value object
          return query
        }
        return query.replace(/\{(\w+)}/g, function (text, key) {
          if (values.hasOwnProperty(key)) {
            return mPool.escape(values[key])
          }
          return text
        })
      }
    })
    logger.info("add the shutdown callback for close the connection pool...")
    require("app/shutdown").addListener(function (name) {
      if (mPool && _.isFunction(mPool.end)) {
        mPool.end(function () {})
      }
      mPool = null
      logger.info("pool is shutdown. Reason of \"", name, "\"...")
    })
  }
}
