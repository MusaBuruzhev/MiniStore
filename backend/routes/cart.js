const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/:userId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения корзины', error });
  }
});

router.post('/:userId', auth, async (req, res) => {
  const { id, title, price, image, selectedColor, selectedVolume, quantity, selected } = req.body;

  // Проверка, что userId совпадает с авторизованным пользователем
  if (req.params.userId !== req.user.id) {
    console.warn(`Несанкционированный доступ: userId ${req.params.userId}, auth user ${req.user.id}`);
    return res.status(403).json({ message: 'Доступ запрещён: можно редактировать только свою корзину' });
  }

  // Валидация входных данных
  if (!id || !title || !price || !image || !selectedColor || !selectedVolume) {
    console.error('Недостаточно данных:', req.body);
    return res.status(400).json({ message: 'Все поля товара обязательны (id, title, price, image, selectedColor, selectedVolume)' });
  }
  if (isNaN(price) || price <= 0) {
    console.error('Некорректная цена:', price);
    return res.status(400).json({ message: 'Некорректная цена' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    console.error('Некорректное количество:', quantity);
    return res.status(400).json({ message: 'Некорректное количество' });
  }

  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    console.log('Найдена корзина:', cart); // Отладка

    if (!cart) {
      console.log(`Создаём новую корзину для userId: ${req.params.userId}`);
      cart = new Cart({ userId: req.params.userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.id === id &&
        item.selectedColor === selectedColor &&
        item.selectedVolume === selectedVolume
    );

    if (existingItemIndex !== -1) {
      console.log(`Обновляем существующий товар: ${id}, индекс: ${existingItemIndex}`);
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      console.log(`Добавляем новый товар: ${id}`);
      cart.items.push({
        id,
        title,
        price: Number(price),
        image,
        selectedColor,
        selectedVolume,
        quantity: quantity || 1,
        selected: selected !== undefined ? selected : true,
      });
    }

    const savedCart = await cart.save();
    console.log('Сохранённая корзина:', savedCart); // Отладка
    res.json({ items: savedCart.items });
  } catch (error) {
    console.error('Ошибка добавления товара в корзину:', error.message, error.stack);
    res.status(500).json({ message: 'Ошибка добавления товара в корзину', error: error.message });
  }
});

router.put('/:userId', auth, async (req, res) => {
  const { items } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
    }

    cart.items = items;
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления корзины', error });
  }
});

router.post('/:userId/checkout', auth, async (req, res) => {
  const { items } = req.body;
  console.log('Получен запрос на оформление заказа:', { userId: req.params.userId, items });

  // Проверка авторизации
  if (req.params.userId !== req.user.id) {
    console.warn(`Несанкционированный доступ: userId ${req.params.userId}, auth user ${req.user.id}`);
    return res.status(403).json({ message: 'Доступ запрещён: можно оформлять только свои заказы' });
  }

  // Валидация
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.error('Некорректные данные заказа:', items);
    return res.status(400).json({ message: 'Выберите хотя бы один товар для оформления заказа' });
  }
  for (const item of items) {
    if (!item.id || !item.title || !item.price || !item.quantity || !item.selectedColor || !item.selectedVolume) {
      console.error('Некорректный товар:', item);
      return res.status(400).json({ message: 'Некорректные данные товара' });
    }
  }

  try {
    // Находим корзину
    console.log('Поиск корзины для userId:', req.params.userId);
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      console.warn(`Корзина не найдена для userId: ${req.params.userId}`);
      return res.status(404).json({ message: 'Корзина не найдена' });
    }
    console.log('Найдена корзина:', cart);

    // Проверяем товары
    const selectedItemIds = items.map(item => `${item.id}-${item.selectedColor}-${item.selectedVolume}`);
    const cartItemIds = cart.items.map(item => `${item.id}-${item.selectedColor}-${item.selectedVolume}`);
    const invalidItems = selectedItemIds.filter(id => !cartItemIds.includes(id));
    if (invalidItems.length > 0) {
      console.error('Товары не найдены в корзине:', invalidItems);
      return res.status(400).json({ message: 'Некоторые товары не найдены в корзине' });
    }

    // Проверяем пользователя
    console.log('Поиск пользователя:', req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('Пользователь не найден:', req.user.id);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    console.log('Найден пользователь:', { email: user.email, balance: user.balance });

    // Проверяем баланс
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log('Итоговая сумма заказа:', totalPrice);
    if (user.balance < totalPrice) {
      console.warn('Недостаточно средств:', { balance: user.balance, totalPrice });
      return res.status(400).json({ message: `Недостаточно средств на балансе. Требуется: ${totalPrice}, доступно: ${user.balance}` });
    }

    // Создаём заказ
    console.log('Создание заказа...');
    const order = new Order({
      userId: req.params.userId,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image || 'https://via.placeholder.com/150',
        selectedColor: item.selectedColor,
        selectedVolume: item.selectedVolume,
        quantity: item.quantity,
      })),
      total: totalPrice,
      status: 'pending',
      createdAt: new Date(),
      // deliveryDate и paymentMethod пока не добавляем
    });
    await order.save();
    console.log('Создан заказ:', order);

    // Списываем деньги
    user.balance -= totalPrice;
    await user.save();
    console.log('Баланс обновлён:', user.balance);

    // Удаляем товары из корзины
    cart.items = cart.items.filter(
      item => !selectedItemIds.includes(`${item.id}-${item.selectedColor}-${item.selectedVolume}`)
    );
    await cart.save();
    console.log('Обновлённая корзина:', cart);

    res.json({ message: 'Заказ успешно оформлен', orderId: order._id });
  } catch (error) {
    console.error('Ошибка оформления заказа:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId,
      items,
    });
    res.status(500).json({ message: 'Ошибка оформления заказа', error: error.message });
  }
});


module.exports = router;