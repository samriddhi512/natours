const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.set('query parser', 'extended');

// 1. GLOBAL MIDDLEWARES
// set security HTTP headers.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com'],
        styleSrc: [
          "'self'",
          'https://unpkg.com',
          'https://fonts.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting max of 100 requests in an hour from the same IP
const limiter = rateLimit({
  max: 100, // prevent DOS and brute force attacks
  windowMs: 60 * 10 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// express parser - reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitisation against NoSQL query injection
app.use(mongoSanitize()); // look at req body, querystring and params and filter out all the $ and .

// Data sanitization against XSS
app.use(xss());
// compress all the text being
app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// a middleware here will be reached iff it is not handled by any routes above
// run default for all other http methods
app.use((req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cannot find ${req.originalUrl} on this server`
  // })
  const err = new AppError(
    `Cannot find ${req.originalUrl} on this server!`,
    404,
  );

  // whenever we pass an arg to next, express assumes it as an error and calls the error handler skiiping other middlewares in stack
  next(err);
});

// global error handling middleware
// has 4 params, express sees FOUR params and knows to call this middleware only on error
app.use(globalErrorHandler);

module.exports = app;
