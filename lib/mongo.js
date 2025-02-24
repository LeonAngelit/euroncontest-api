const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('../config/config');

const client = new MongoClient(config.mongoURL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = client;