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
}, () => {
  console.log('Connected to DB!');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());

app.use(requestLogger);

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
  if (err.name === 'ValidationError') {
    return res.status(BAD_REQUEST_CODE).send('Переданы неверные данные');
  }
  if (err.name === 'CastError') {
    return res.status(NOT_FOUND_CODE).send('Объект не найден');
  }

  const { statusCode = 500, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
});
