const mongoose = require('mongoose');
const validationLibrary = require('validator');
const bcrypt = require('bcryptjs');
const BadRequestError = require('../errors/bad-request-err');
const AuthorizationError = require('../errors/authorization-err.js');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  about: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  avatar: {
    type: String,
    required: true,
    validate: {
      validator(avatarLink) {
        return validationLibrary.isURL(avatarLink);
      },
      message: (props) => `${props.value} неправильный формат ссылки!`,
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator(userEmail) {
        return validationLibrary.isEmail(userEmail);
      },
      message: (props) => `${props.value} неправильный формат email!`,
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

userSchema.statics.findUserByCredentials = function findUserByCredentials(email, password) {
  return this.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        return Promise.reject(new AuthorizationError('Неправильные почта или пароль'));
      }

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            return Promise.reject(new BadRequestError('Неправильные почта или пароль'));
          }

          return user; // теперь user доступен
        });
    });
};

module.exports = mongoose.model('User', userSchema);
