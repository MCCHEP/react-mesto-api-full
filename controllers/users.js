const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/not-found-err');
const AuthorizationError = require('../errors/authorization-err');
const BadRequestError = require('../errors/bad-request-err');

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.send({ data: users }))
    .catch(next);
};

module.exports.getMyInfo = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Такого пользователя не существует');
      }

      res.send(user);
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    email, password,
  } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({
      name: 'User',
      about: 'Nothing about',
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Cousteau1972_%28cropped%29.jpg/427px-Cousteau1972_%28cropped%29.jpg',
      email,
      password: hash,
    }))
    .then((user) => {
      if (!user) {
        throw new BadRequestError('Переданы некорректные данные!');
      }
      res.status(201).send({ data: user });
    })
    .catch(next);
};

module.exports.updateProfile = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { name: req.body.name, about: req.body.about } },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (!user) {
        throw new BadRequestError('Переданы некорректные данные!');
      }
      res.send({ data: user });
    })
    .catch(next);
};

module.exports.updateAvatar = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: req.body.avatar } },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (!user) {
        throw new BadRequestError('Переданы некорректные данные!');
      }
      res.send({ data: user });
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      if (!user) {
        throw new AuthorizationError('Неправильные почта или пароль');
      }

      const token = jwt.sign({ _id: user._id }, 'some-secret-key', {
        expiresIn: '7d',
      });

      return res.send({ token });
    })
    .catch(next);
};
