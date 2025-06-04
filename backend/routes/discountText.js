const express = require('express');
const DiscountText = require('../models/DiscountText');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let discountText = await DiscountText.findOne();
    if (!discountText) {
      discountText = new DiscountText({ text: '' });
      await discountText.save();
    }
    res.json({ text: discountText.text });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения текста скидки', error });
  }
});

router.put('/', auth, admin, async (req, res) => {
  const { text } = req.body;

  try {
    let discountText = await DiscountText.findOne();
    if (!discountText) {
      discountText = new DiscountText({ text });
    } else {
      discountText.text = text;
    }

    await discountText.save();
    res.json({ text: discountText.text });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления текста скидки', error });
  }
});

module.exports = router;