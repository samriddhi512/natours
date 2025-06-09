const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: false, //when true cookie will only be sent on an encrypted connection - https
    httpOnly: true, // cookie cannot be accessed or modified in anyway by browser. Prevent XSS. Receive store & send automatically
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2. check if user exists and password is correct
  // remember password select is false, so it will not be included in find automatically
  const user = await User.findOne({ email }).select('+password');
  const correct = await user?.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. if everything ok send the token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) get the token and check if it exists
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to continue', 401),
    );
  }
  // 2) verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists - user deleted by someone still has the token - dont log him in!
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('This user no longer exists!', 401));
  }

  // 4) also check if user changed passwords after the token was issued - token stolen so a user changes password
  // so auth token generated before should not be valid

  if (await user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again!', 401),
    );
  }

  // grant access to the protected data
  req.user = user;
  res.locals.user = user;
  next();
});

// only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      const user = await User.findById(decoded.id);
      if (!user) return next();

      if (await user.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // grant access to the protected data
      res.locals.user = user;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have the permission to perform this action!',
          403,
        ),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on the posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User not found!', 404));
  }

  // 2. generate a random token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send it to user's email
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to mail',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // 2. set the new password only if token not expired and user exists
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  // 3. update the change password at property
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 4. log the user in - send the token back

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // should be available to logged in user + need password to change
  // prevent anyone from changing pwd if they have access to your laptop
  const passwordCurrent = req.body.passwordCurrent;
  if (!passwordCurrent)
    next(
      new AppError('Your current password is needed to update password', 401),
    );

  const user = await User.findById(req.user.id).select('+password');

  const correct = await user.correctPassword(passwordCurrent, user.password);
  if (!correct)
    next(new AppError('Current password entered is incorrect', 401));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
