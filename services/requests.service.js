
const client = require('../lib/mongo');
const config = require("../config/config");

class RequestService {
  constructor() { }

  async run() {
    const dbConnection = await client.db(config.mongoRSName).collection(config.mongoComfyCollectionName);
    return dbConnection;
  }

  async create(data) {
    let template = ''
    let requestData = '';
    if(["image_to_video","upscale","clean"].includes(data.model)){
      if (data.model == "image_to_video") {
        template = config.imageToVideoTemplate;
        try {
          requestData = this.#formatString(template, data.prompt, data.imgPath, data.imgPath)
        } catch (error) {
          return error;
        }
      }
      if (data.model == "upscale") {
        template = config.upscaleTemplate;
        try {
          requestData = this.#formatString(template, data.imgPath, data.imgPath, data.imgPath)
        } catch (error) {
          return error;
        }
      }
      if (data.model == "clean") {
        try {
          requestData = "clean"
        } catch (error) {
          return error;
        }
      }
    } else {
      return "No valid model"
    }
   
    const newRequest = await (await this.run()).insertOne({request: requestData});
    const response = newRequest ? 1 : newRequest;
    return response;
  }

  async delete() {
    const archive = await (await this.run()).deleteMany({})
    return archive;
  }

  #formatString = function (template, ...args) {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return typeof args[index] !== 'undefined' ? args[index] : match;
    });
  }

}

module.exports = RequestService;
