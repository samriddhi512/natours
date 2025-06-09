const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have lesser or equal than 40 chars'],
      minlength: [10, 'A tour name must have more or equal than 10 chars'],
      // validate: [validator.isAlpha, ''] // not useful so commenting but leaving for reference
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // only for string {values, message} elaborate of above version
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price ({VALUE}) should be lesser than actual price',
        // message to trigger if validate's validator returns false. VALUE and val have access to same data!
        validator: function (val) {
          // real function as <this> should point to the current document
          // CAVEAT: <this> only points to current doc on NEW document creation! Not on udpate
          return val < this.price; // this is valid as discount should be lesser than item price
          //need to return either true or false. When false -> trigger error message
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        // not mongodb schema type, type of geoJSON
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // [latitude,longitude]
      description: String,
      address: String,
    },
    locations: [
      // array of locations
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
        description: String,
        address: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere'})

tourSchema.virtual('durationWeeks').get(function () {
  // has to be a normal function so that this is available
  // this points to the current document
  // cannot be used in a query.For eg: cannot do tour.find().where(durationWeeks).equals..
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // name of field in foreign table referencing here
  localField: '_id', // name of the field referred here
});

// DOCUMENT MIDDLEWARE, Runs before create(), save() {mongoose methods}, not insertMany() etc which are mongodb methods
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // here the this points to the query object
  // usecase: DB has secret tours, only offered in special cases
  // but above works for find and findOne, thus does not work for findById also if 'find' string used
  // so used regex
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   //docs refer to all docs returned by query
//   console.log('Query took', Date.now() - this.start, 'milliseconds');
//   next();
// });

// commenting out - as interfering with geoJSON pipeline by making geonear as second op
// AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // this.pipeline() returns the array of all the stages
//   // add a stage to the front of this array which filters out the secret tour.
//   // better to add this here, than to add in match of each individual aggregator - prone to error, one may forget
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
