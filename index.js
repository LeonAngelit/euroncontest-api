const express = require('express');
const routerApi = require('./routes/index');
const cors = require('cors');
require('dotenv').config();
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
  res.send('Hola');
});

routerApi(app);
app.use(logErrors);
app.use(boomErrorHandler);
app.use(sequelizeError);
app.use(errorHandler);

app.listen(port, () => {
  console.log('My port' + port);
});
