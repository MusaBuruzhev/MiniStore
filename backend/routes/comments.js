const express = require('express');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ productId: req.params.productId });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения комментариев', error });
  }
});

router.post('/:productId', auth, async (req, res) => {
  const { text } = req.body;

  if (!text.trim()) {
    return res.status(400).json({ message: 'Комментарий не может быть пустым' });
  }

  try {
    const comment = new Comment({
      productId: req.params.productId,
      userId: req.user.id,
      userEmail: req.user.email,
      text,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка добавления комментария', error });
  }
});

module.exports = router;