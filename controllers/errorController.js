const AppError = require('../utils/appError');

function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
}

function handleDuplicateFieldsDB(err) {
  const [[field, value]] = Object.entries(err.keyValue);
  const message = `Duplicate value for field: ${field}, value: ${value}, Please use another value!`;
  return new AppError(message, 400);
}

function handleValidationErrorDB(err) {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 400);
}

function handleJWTError() {
  return new AppError('Invalid token, please login again!', 401);
}

function handleTokenExpiredError() {
  return new AppError('Your token has expired. Please login again! ', 401);
}

function sendErrorDev(err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
}

function sendErrorProduction(err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    console.log('api error')
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // programming or any untrusted error, don't leak error details
      // 1. Log error
      console.log(err);
      // 2. Send generic message to client
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  } else {
    console.log(err);
    // Send generic message to client
    return res.status(500).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later!',
    });
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProduction(error, req, res);
  }
};
