const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// one user can put only one review for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // aggregate to be called on the model, & statics implies this refers to the model (not document)
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // if no review for tour remaing, set to default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // note: post middleware does not get access to next
  // this points to current review i.e document
  // Review model is not yet defined. how to Review.calcAvgRatings?
  // this = document , this.constructor = document's Model
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate - internally findOneAnd..
// findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this is a query middleware - it does not get access to the doc
  // here this refers to the query
  // again, this should ideally be post - presave, the new rating is not yet in collection on which aggregation happens
  // but if we change to post we won't also have access to this.findOne to get the doc
  this.review = await this.findOne(); // execute the query - and store the res which is the doc
  // save to this so it is available in post middleware also
});

reviewSchema.post(/^findOneAnd/, async function () {
  // query is finished now and we can now call calc avg ratings
  // await this.findOne does not work here, query is already executed
  // this = query, this.review = review document that we stored to this in pre query middleware
  // this.review.constructor = review doc's constructor = review Model
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
