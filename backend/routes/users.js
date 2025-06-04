const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb('Ошибка: только изображения (jpeg, jpg, png)!');
  },
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, surname, phone, birthdate, about } = req.body;

  const phoneRegex = /^\+\d{11}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат телефона (+79991234567)' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.name = name || user.name;
    user.surname = surname || user.surname;
    user.phone = phone || user.phone;
    user.birthdate = birthdate || user.birthdate;
    user.about = about || user.about;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления профиля', error });
  }
});

router.post('/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка загрузки аватара', error });
  }
});

router.delete('/:id/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.avatar = null;
    await user.save();
    res.json({ message: 'Аватар удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления аватара', error });
  }
});

router.post('/:id/balance', auth, async (req, res) => {
  const { cardholderName, cardNumber, expiryDate, cvv, amount } = req.body;

  // Проверка, что id совпадает с авторизованным пользователем
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'Доступ запрещён: можно пополнять только свой баланс' });
  }

  // Валидация cardholderName
  const words = cardholderName?.trim().split(/\s+/);
  if (!cardholderName || words.length < 2) {
    return res.status(400).json({ message: 'Введите имя и фамилию (минимум два слова)' });
  }

  // Валидация суммы
  if (!amount || amount < 500 || amount > 100000) {
    return res.status(400).json({ message: 'Сумма должна быть от 500 до 100000 рублей' });
  }

  // Валидация номера карты
  if (!cardNumber || !/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
    return res.status(400).json({ message: 'Неверный номер карты' });
  }

  // Валидация срока действия
  if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return res.status(400).json({ message: 'Некорректный формат срока действия (MM/YY)' });
  }
  const [month, year] = expiryDate.split('/');
  const cardMonth = parseInt(month, 10);
  const cardYear = parseInt(year, 10);
  if (cardMonth < 1 || cardMonth > 12 || cardYear < 0 || cardYear > 99) {
    return res.status(400).json({ message: 'Некорректный срок действия карты' });
  }

  // Валидация CVV
  if (!cvv || !/^\d{3,4}$/.test(cvv)) {
    return res.status(400).json({ message: 'Неверный CVV (3 или 4 цифры)' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.balance += Number(amount);
    user.lastCardDigits = cardNumber.slice(-4);
    await user.save();

    res.json({ message: 'Баланс успешно пополнен', balance: user.balance });
  } catch (error) {
    console.error('Ошибка пополнения баланса:', error); // Логируем на сервере
    res.status(500).json({ message: 'Ошибка пополнения баланса', error: error.message });
  }
});

router.get('/top-buyers', async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar',
          totalSpent: 1,
          discount: '$user.discount',
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения топ покупателей', error });
  }
});

router.put('/:id/discount', auth, admin, async (req, res) => {
  const { discount } = req.body;

  if (discount < 0 || discount > 100) {
    return res.status(400).json({ message: 'Скидка должна быть от 0 до 100%' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.discount = discount;
    await user.save();
    res.json({ message: 'Скидка обновлена', discount });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления скидки', error });
  }
});

module.exports = router;