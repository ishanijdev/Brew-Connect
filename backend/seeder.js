const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('./data/products.js');
const Product = require('./models/productModel.js');
const connectDB = require('./db.js');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();

    // Insert new data
    await Product.insertMany(products);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();