const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

//MIDDLEWARES
app.use(morgan('dev'));

// express.json is middleware, fn that can modify the incoming req data. Sits between req and res
// modifies req so that body is available on it
app.use(express.json());

app.use((req, res, next) => {
  // apply to each and every request -> we have not specified any route for which this should apply to
  // app.use -> tell express we want to use a middleware
  console.log('Hello from the middleware 🤑');
  next(); //must not forget
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// CONSTANTS
const port = 3000;

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`),
);

const getAllTours = (req, res) => {
  res.status(200).json({
    // jsend data formatting
    status: 'success',
    results: tours.length, // can send if data contains an array
    data: {
      tours,
    },
  });
};
const getTour = (req, res) => {
  // api/v1/tours/5
  // /api/v1/tours/:id/:x?
  // x is optional, else req would fail without x param
  console.log(req.params);
  const id = Number(req.params.id);
  if (id >= tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID',
    });
  }
  const tour = tours.find((ele) => ele.id === id);
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};
const createTour = (req, res) => {
  // client would have sent data & that'd ideally be available on req
  // express does not put that body data on req, so we use a middleware
  const newId = tours[tours.length - 1].id + 1;
  const newTour = { id: newId, ...req.body };
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    },
  );
};
const updateTour = (req, res) => {
  const id = Number(req.params.id);
  if (id >= tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID',
    });
  }
  let updatedTour;
  tours.forEach((ele, index) => {
    if (ele.id === id) {
      tours[index] = { ...ele, ...req.body };
      updatedTour = tours[index];
    }
  });
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(200).json({
        status: 'success',
        data: {
          tour: updatedTour,
        },
      });
    },
  );
};
const deleteTour = (req, res) => {
  const id = Number(req.params.id);
  if (id >= tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID',
    });
  }
  // not actually deleting dummy ops
  res.status(204).json({
    // status for no content - when operation successful, but no data to send
    status: 'success',
    data: null,
  });
};
const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented! 💩',
  });
};
const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented! 💩',
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented! 💩',
  });
};
const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented! 💩',
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented! 💩',
  });
};

// ROUTES
// creating routers
const tourRouter = express.Router();
const userRouter = express.Router();

// mounting the routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// kind of like a sub-app using a sub-router
// notice the change in path, relative to subRouter
tourRouter.route('/').get(getAllTours).post(createTour);

tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

userRouter.route('/').get(getAllUsers).post(createUser);

userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

app.listen(port, () => {
  console.log(`started listening at ${port}`);
});

// It is not the best - verbose, also maybe want to change v1 to v2 have to change in all places
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
