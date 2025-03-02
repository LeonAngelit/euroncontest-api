require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'dev',
  isProd: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbPort: process.env.DB_PORT,
  dbUrl: process.env.DATABASE_URL,
  pkey: process.env.P_KEY,
  authp: process.env.AUTH_P,
  nombreUsuarioRegex:
    /^(?=.{5,25}$)[a-zA-ZáéíóúüñÁÉÍÓÚÑ0-9_]+(?:[\s][a-zA-ZáéíóúüñÁÉÍÓÚÑ0-9]+)*$/,
  passwordRegex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
  mongoRSName: process.env.MONGO_RS_NAME,
  mongoCollectionName: process.env.MONGO_COLLECTION_NAME,
  mongoURL: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_DOMAIN}/?retryWrites=true&w=majority&appName=${process.env.MONGO_APP_NAME}`,
  imagesCloudName: process.env.IMAGES_CLOUD_NAME,
  imagesCloudKey: process.env.IMAGES_API_KEY,
  imagesCloudSecret: process.env.IMAGES_API_SECRET
};

module.exports = config;
