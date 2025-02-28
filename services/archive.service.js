const boom = require("@hapi/boom");
const client = require('../lib/mongo');
const config = require("../config/config");
const { ObjectId } = require('mongodb');

class ArchiveService {
  constructor() { }

  async run() {
    const dbConnection = await client.db(config.mongoRSName).collection(config.mongoCollectionName);
    return dbConnection;
  }

  async create(data) {
    const newArchive = await (await this.run()).insertOne(data);
    return newArchive;
  }

  async find() {
    const archives = await (await this.run()).find().toArray();
    return archives;
  }

  async findOne(id) {
    const archive = await (await this.run()).findOne({
      _id: new ObjectId(id),
    });
    if (!archive) {
      throw boom.notFound("Archive not found");
    }
    return archive;
  }
  async findRoomsByUserId(userId) {
    const archives = await (await this.run()).find({
      "room.users.id": userId,
    }).toArray();
    return archives;
  }

  async findByUserName(userName) {
    const archiveCollection = await this.run();
    const archives = await archiveCollection.find({
      "room.users.username": userName,
    }).toArray();
  
    if (archives.length === 0) {
      throw boom.notFound("Archive not found");
    }
  
    return archives;
  }

  async findByYear(year) {
    const archive = await (await this.run()).find({
      year: year,
    });
    return archive;
  }


}

module.exports = ArchiveService;
