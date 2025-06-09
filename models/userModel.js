const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'role can be of the type user, guide, lead-guide, or admin only',
    },
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // this only works on CREATE & SAVE!! save not udpate for users!
      validator: function (value) {
        return value === this.password;
      },
      message: 'Passwords are not matching!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// MIDDLEWARES
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 13);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // small hack to keep the password changed at bit earlier
  // to prevent condition when save is run slower and jwt token is created faster
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({active: {$ne: false}});
  next();
})

// COMMON METHODS DEFINED
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // this is defined on all the docs, so this not available
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );

    return changedTimestamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const randomToken = await crypto.randomBytes(32).toString('hex');
  // this token will be sent to user's email which they can use to reset password.

  // temporarily store this reset token - hashed (to prevent hacker from stealing it)
  const hashedToken = crypto
    .createHash('sha256')
    .update(randomToken)
    .digest('hex');
  this.passwordResetToken = hashedToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return randomToken;
};

module.exports = new mongoose.model('User', userSchema);
