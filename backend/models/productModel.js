const mongoose = require('mongoose');

// This is the blueprint for our product data
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // The name is mandatory
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  tags: {
    type: [String], // An array of strings
    required: false, // Tags are optional
  },
}, {
  timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
});

// Create the model from the schema
const Product = mongoose.model('Product', productSchema);

module.exports = Product;