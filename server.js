const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION! Shutting down..💥', err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB)
  .then(() => console.log('DB connection is Successful!'))
  .catch((err) => console.log(err.name, err.message));

const app = require('./app');

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`started listening at ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down..💥', err.name, err.message);
  // exit gracefully
  server.close(() => process.exit(1));
});
