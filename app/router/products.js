/*
 * vegapi - https://github.com/jodusnodus/vegapi.git
 *
 * Copyright (c) 2018 JodusNodus
 */

/**
 * @module va/router/mysql
 *
 * @requires express
 * @requires va/executor
 * @requires va/service/show-databases
 */

"use strict"

const express = require("express")

const executor      = require("app/executor")
const showDatabases = require("app/service/show-databases")

const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true
})

router.get("/", function (req, res) {
    executor.execute(req, res, function (sender) {
    /** @type {ShowDatabasesOptions} */
        const options = {
            pattern: req.query.pattern
        }
        sender(showDatabases.execute(options), "databases")
    })
})

module.exports = router
