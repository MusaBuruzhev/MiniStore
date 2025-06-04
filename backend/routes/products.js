const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.get('/', async (req, res) => {
  const { category, brands, search, sort } = req.query;
  let query = {};
  if (category) query.category = category;
  if (brands) query.brand = { $in: brands.split(',') };
  if (search) query.name = { $regex: search, $options: 'i' };

  let sortOption = {};
  switch (sort) {
    case 'priceAsc': sortOption.price = 1; break;
    case 'priceDesc': sortOption.price = -1; break;
    case 'titleAsc': sortOption.name = 1; break;
    case 'titleDesc': sortOption.name = -1; break;
  }

  try {
    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения товаров', error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения товара', error });
  }
});

router.post('/', auth, admin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка добавления товара', error });
  }
});

router.put('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления товара', error });
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json({ message: 'Товар удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления товара', error });
  }
});

module.exports = router;