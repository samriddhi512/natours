const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => console.log('connected'))
  .catch((err) => console.log(err));

const insertData = async function () {
  try {
    const tours = JSON.parse(
      fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'),
    );
    const users = JSON.parse(
      fs.readFileSync(`${__dirname}/users.json`, 'utf-8'),
    );
    const reviews = JSON.parse(
      fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
    );
    await User.insertMany(users, { validate: false });
    await Tour.create(tours);
    await Review.insertMany(reviews);

    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async function () {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

console.log(process.argv[2]);

if (process.argv[2] === '--import') {
  insertData();
}
if (process.argv[2] === '--delete') {
  deleteData();
}

// (async function () {
//   try {
//     await mongoose.connect(DB);
//     const data = JSON.parse(
//       fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
//     );
//     await Tour.deleteMany();
//     // await Tour.insertMany(data);
//   } catch (err) {
//     console.log(err);
//   }
// })();
