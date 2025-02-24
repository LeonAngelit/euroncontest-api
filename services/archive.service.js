const boom = require("@hapi/boom");
const { response } = require("express");
const  client  = require('../lib/mongo');
const { connect } = require("puppeteer-core");

class ArchiveService {
  constructor() { 

  }

  async run () {
    const dbConnection = await client.db("Eurocontest").collection("Archive");
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
      _id: id,
    });
    if (!archive) {
      throw boom.notFound("Archive not found");
    }
    return archive;
  }
  async findRoomsByUserId(userId) {
    const archives = await (await this.run()).find({
      userId: userId,
    }).toArray();
    return archives;
  }

  async findByYear(year) {
    const archive = await (await this.run()).find({
      year: year,
    });
    return archive;
  }

  async deleteByYear(year) {
    const archive = await (await this.run()).deleteMany({
      year: parseInt(year),
    });
    return archive;
  }
}

module.exports = ArchiveService;
