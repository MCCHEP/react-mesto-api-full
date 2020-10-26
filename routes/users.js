const users = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  getMyInfo,
} = require('../controllers/users');

const urlRegex = /^https?:\/{2}\S+\.\S{2,}/;

users.get('/', getUsers);
users.get('/me', getMyInfo);
users.get('/:userId', celebrate({
  params: Joi.object().keys({
    userId: Joi.string().alphanum().length(24),
  }),
}), getUserById);
users.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    about: Joi.string().required().min(2).max(30),
  }),
}), updateProfile);
users.patch('/me/avatar', celebrate({
  body: Joi.object().keys({
    avatar: Joi.string().required().regex(urlRegex),
  }),
}), updateAvatar);

module.exports = users;
