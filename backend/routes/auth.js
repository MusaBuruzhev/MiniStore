const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const validDomains = ['gmail.com', 'mail.com', 'email.com'];

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, agreement } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'Имя и фамилия обязательны' });
  }

  if (!email.includes('@') || !validDomains.includes(email.split('@')[1])) {
    return res.status(400).json({ message: 'Неверный формат email' });
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (password.length < 6 || !hasLetter || !hasNumber) {
    return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов, букву и цифру' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Пароли не совпадают' });
  }

  if (!agreement) {
    return res.status(400).json({ message: 'Требуется согласие с пользовательским соглашением' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: firstName,
      surname: lastName,
      email,
      password: hashedPassword,
      isAdmin: email === 'balaev134@gmail.com' && password === '_Sait_9087',
    });

    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка регистрации', error });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email.includes('@') || !validDomains.includes(email.split('@')[1])) {
    return res.status(400).json({ message: 'Неверный формат email' });
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (password.length < 6 || !hasLetter || !hasNumber) {
    return res.status(400).json({ message: 'Неверный формат пароля' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка авторизации', error });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
});

module.exports = router;