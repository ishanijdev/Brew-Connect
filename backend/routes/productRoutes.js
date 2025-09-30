const express = require('express');
const Product = require('../models/productModel.js');

const router = express.Router();

// This will be the route for GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}); // find({}) gets all documents
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get coffee recommendations by mood
// @route   GET /api/products/mood/:mood
// @access  Public
router.get('/mood/:mood', async (req, res) => {
  // A simple map to link moods from the front-end to tags in our database
  const moodToTagsMap = {
    sleepy: ['bold', 'energetic'],
    stressed: ['calm', 'relaxing', 'foamy'],
    happy: ['sweet', 'creamy', 'dessert'],
    focused: ['bold', 'healthy', 'classic'],
    chill: ['creamy', 'refreshing', 'afternoon', 'summer'],
  };

  const mood = req.params.mood;
  const tagsToFind = moodToTagsMap[mood];

  if (!tagsToFind) {
    return res.status(404).json({ message: 'Mood not found' });
  }

  try {
    // Find products where the 'tags' array contains at least one of the tags we're looking for
    const products = await Product.find({ tags: { $in: tagsToFind } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;