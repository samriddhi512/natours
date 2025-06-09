const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload an image', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

function getFilteredBody(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
}

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.uploadPhoto = upload.single('photo');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {

  // 1. error if user tries to update password - different route for that
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400,
      ),
    );
  }
  // 2. update user document
  const filteredBody = getFilteredBody(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // here, we can do findById and update, we dont want presave and required validations to run.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
exports.deactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully, login again to activate',
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined, Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

// do not change passwords with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
