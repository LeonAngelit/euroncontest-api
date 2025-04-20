const boom = require('@hapi/boom');
const e = require('express');
const { ValidationError } = require('sequelize');

function logErrors(err, req, res, next) {
  next(err);
}

function boomErrorHandler(err, req, res, next) {
  if (err.isBoom) {
    const { output } = err;
    res.status(output.statusCode).json(output.payload);
  }
  next(err);
}

function sequelizeError(err, req, res, next) {
  if (err instanceof ValidationError) {
    res.status(409).json({
      statusCode: 409,
      message: err.message,
      errors: err.errors,
    });
  }
}

function errorHandler(err, req, res, next) {
  if(!err instanceof ValidationError){
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
 
}

module.exports = { logErrors, errorHandler, boomErrorHandler, sequelizeError };
