const cacheManager = require("cache-manager")
const configUtil = require("app/config-util")
const { promisify } = require("util")
// const memcachedStore = require('cache-manager-memcached-store')
const memjs = require('memjs')

function memcachedStore({ expires, options: { hosts, user, password }}) {
  process.env.MEMCACHIER_USERNAME = user
  process.env.MEMCACHIER_PASSWORD = password
  return memjs.Client.create(hosts.join(","), { expires })
}

function start(settings) {
  const host = configUtil.getSetting(settings, "memcached.host")
  const user = configUtil.getSetting(settings, "memcached.user")
  const password = configUtil.getSetting(settings, "memcached.password")
  const client = memcachedStore({
    expires: 60 * 15,
    options: {
      user,
      password,
      hosts: [host]
    }
  })

  const get = promisify(client.get).bind(client)
  const set = promisify(client.set).bind(client)
  const increment = promisify(client.increment).bind(client)
  const decrement = promisify(client.decrement).bind(client)

  async function wrap(key, fn, options = {}) {
    options.expires = options.ttl
    try {
      const val = await get(key)
      if (val === null) throw "Not Found"
      return JSON.parse(val)
    } catch (err) {
      const val = await new Promise((resolve, reject) => {
        const x = fn(resolve)
        if (x && x.then) {
          x.then(resolve).catch(reject)
        }
      })
      await set(key, JSON.stringify(val === undefined ? null : val), options)
      return val
    }
  }

  module.exports = { wrap, set, get, client, start, increment, decrement }
}

module.exports.start = start

