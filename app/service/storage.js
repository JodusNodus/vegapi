const Storage = require('@google-cloud/storage')

const projectId = 'vegapi-197219'

const storage = new Storage({
  projectId,
  keyFilename: "vegapi-df62d1956973.json"
})
const bucket = storage.bucket("vegstorage")

module.exports.uploadPicture = async function(name, buffer) {
  const blob = bucket.file(name)
  await blob.save(buffer, {
    resumable: false,
    public: true,
    metadata: {
      name,
      contentType: "image/jpeg",
    },
  })
}
