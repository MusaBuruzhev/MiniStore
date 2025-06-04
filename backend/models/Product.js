const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  name: { type: String, required: true },
  description: { type: String, required: true },
  info: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  image: { type: String },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  volume: {
    gb1: String,
    gb2: String,
    gb3: String,
  },
  rating: { type: Number },
  phone1: { img: String, color: String },
  phone2: { img: String, color: String },
  phone3: { img: String, color: String },
  phone4: { img: String, color: String },
  isNew: { type: Boolean, default: false },
});

module.exports = mongoose.model('Product', productSchema);