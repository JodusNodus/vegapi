require("app-module-path").addPath(__dirname)

const http      = require("http")
const fs        = require("fs")
const path      = require("path")

const info      = require("app/info")
const args      = require("app/args")
const configure = require("app/configure")
const shutdown  = require("app/shutdown")

http.globalAgent.maxSockets = 50


if (args.isHelp()) {
    const content = fs.readFileSync(path.join(__dirname, "man.txt"))
    _printHeaderAndHero()
    console.info(content.toString())
    process.exit(0)
}

const configureOptions = {
    configFilename: args.getConfigFilename(),
    name:       info.getAppName(),
    path:       args.getLogPath(),
    shutdown: function (name) {
        shutdown.shutdown(name)
        console.info("Server is shutdown with \"%s\"", name)
    }
}

async function main() {
  const settings = await configure(configureOptions)
  const logger = require("app/logger").start(settings)
  try {
    printHeaderAndHero(logger)
    logger.info("Logger is started...")
    require("app/cache").start(settings)
    require("app/db").start(settings)

    require("app/application")
      .start(settings)
      .then(function () {
        // now the express application is listen
        logger.info("application is running ...")
      }, function (reason) {
        logger.warn(reason)
        process.exit(1)
      })
  } catch (e) {
    console.error(e)
  }
}

main()

function printHeaderAndHero(logger) {
    const heroFile = path.join(__dirname, "hero.txt")
    if (fs.existsSync(heroFile)) {
        const hero = fs.readFileSync(heroFile, "utf8").toString()
        const lines = hero.split("\n")
        lines.forEach(function (line) {
            if (logger) {
                logger.info(line)
                if (logger.isConsole) {
                    return
                }
            }
            console.info(line)
        })
    }
    info.headerPrint(logger)
}
