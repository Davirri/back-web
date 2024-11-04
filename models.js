const mongoose = require('mongoose');

// Esquema para el modelo User
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  isAdmin: { type: Boolean, default: false },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  merch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merch' }],
});

// Esquema para el modelo Product
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Esquema para el modelo News
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Esquema para el modelo Merch
const merchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Crear los modelos de Mongoose
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const News = mongoose.model('News', newsSchema);
const Merch = mongoose.model('Merch', merchSchema);

module.exports = { User, Product, News, Merch };
