const mongoose = require('mongoose');

const discountTextSchema = new mongoose.Schema({
  text: { type: String, default: '' },
});

module.exports = mongoose.model('DiscountText', discountTextSchema);