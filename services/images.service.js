const cloudinary = require('cloudinary').v2;
const config = require("../config/config");

class ImagesService {
    constructor() {

        cloudinary.config({
            cloud_name: config.imagesCloudName,
            api_key: config.imagesCloudKey,
            api_secret: config.imagesCloudSecret
        });

    }

    async upload(imageBuffer) {   
        try {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_pics",
                        quality: "auto",
                        width: 800
                    },
                    (error, result) => {
                        if (error) {
                            return reject(error); 
                        }
                        resolve(result); 
                    }
                );
               
                stream.end(imageBuffer.buffer);
            });
            return uploadResult.secure_url; 
        } catch (error) {
            throw Boom.internal("Upload failed", error); 
        }
    }

}

module.exports = ImagesService;

