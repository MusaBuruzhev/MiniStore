const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  birthdate: { type: String },
  about: { type: String },
  avatar: { type: String },
  balance: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  hasFirstPurchase: { type: Boolean, default: false },
  lastCardDigits: { type: String },
});

module.exports = mongoose.model('User', userSchema);