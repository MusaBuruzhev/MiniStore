const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{
    id: String,
    title: String,
    price: Number,
    quantity: Number,
    selectedColor: String,
    selectedVolume: String,
    image: String,
    selected: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('Cart', cartSchema);