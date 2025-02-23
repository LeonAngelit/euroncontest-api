const boom = require("@hapi/boom");
const { response } = require("express");
const  client  = require('../lib/mongo');

class ArchiveService {
  constructor() { }

  async create(data) {
    const newArchive = await client.db("Eurocontest").collection("Archive").insertOne(data);
    return newArchive;
  }

  async find() {
    const archives = await client.db("Eurocontest").collection("Archive").find().toArray();
    return archives;
  }

  async findOne(id) {
    const archive = await client.db("Eurocontest").collection("Archive").findOne({
      _id: id,
    });
    if (!archive) {
      throw boom.notFound("Archive not found");
    }
    return archive;
  }
  async findRoomsByUserId(userId) {
    const archives = await client.db("Eurocontest").collection("Archive").find({
      userId: userId,
    }).toArray();
    return archives;
  }

  async findByYear(year) {
    const archive = await client.db("Eurocontest").collection("Archive").find({
      year: year,
    });
    return archive;
  }
}

module.exports = ArchiveService;
