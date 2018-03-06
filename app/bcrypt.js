const bcrypt = require("bcrypt")

module.exports.hash = pass => new Promise((res, rej) => {
  bcrypt.hash(pass, 5, function(err, hash) {
    if (err) {
      rej(err)
    } else {
      res(hash)
    }
  })
}) 

module.exports.compare = (password, passHash) => new Promise((res, rej) => {
  bcrypt.compare(password, passHash, function(err, isEqual) {
    if (err) {
      rej(err)
    } else {
      res(isEqual)
    }
  })
}) 
