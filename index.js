const express = require('express');
const routerApi = require('./routes/index');
const cors = require('cors');
const CountryService = require('./services/countries.service');
require('dotenv').config();
const service = new CountryService();
const app = express();
const port = process.env.PORT || 3020;
const {
  logErrors,
  errorHandler,
  boomErrorHandler,
  sequelizeError,
} = require('./midlewares/error.handler');

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
  service.refresh('2023');
  service.res.send('Hola');
});

routerApi(app);
app.use(logErrors);
app.use(boomErrorHandler);
app.use(sequelizeError);
app.use(errorHandler);

app.listen(port, () => {
  console.log('My port' + port);
});
