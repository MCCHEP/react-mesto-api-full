require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');

const { requestLogger, errorLogger } = require('./middlewares/logger');
const auth = require('./middlewares/auth');
const users = require('./routes/users');
const cards = require('./routes/cards');
const {
  login,
  createUser,
} = require('./controllers/users');

const app = express();

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

app.use(cors());
app.listen(PORT);
app.use(cookieParser());
app.use(bodyParser.json());

app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(64),
  }),
}), login);
app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(64),
  }),
}), createUser);

app.use(auth);
app.use('/users', users);
app.use('/cards', cards);

app.use(errorLogger);

app.use(errors());
app.use((err, req, res, next) => {
  const BAD_REQUEST_CODE = 400;
  const NOT_FOUND_CODE = 404;
  const CONFLICT_CODE = 409;

  if (err.name === 'ValidationError') {
    return res.status(BAD_REQUEST_CODE).send({ message: 'Переданы неверные данные' });
  }
  if (err.name === 'CastError') {
    return res.status(NOT_FOUND_CODE).send({ message: 'Объект не найден' });
  }
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(CONFLICT_CODE).send({ message: 'Вы уже регистрировались' });
  }

  const { statusCode = 500, message } = err;
  next();
  return res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
});
