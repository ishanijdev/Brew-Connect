const express = require('express');
const { protect } = require('../middleware/authMiddleware.js');
const User = require('../models/userModel.js');
const Product = require('../models/productModel.js');

const router = express.Router();

// @desc    Add an item to the cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, async (req, res) => {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const product = await Product.findById(productId);
        if(!product) return res.status(404).json({ message: 'Product not found' });
        
        const existingItem = user.cartItems.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cartItems.push({
                product: productId,
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
                quantity: quantity
            });
        }
        const updatedUser = await user.save();
        res.status(200).json(updatedUser.cartItems);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if(user) {
        res.json(user.cartItems);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Add this new route inside backend/routes/cartRoutes.js

// @desc    Clear all items from cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if(user) {
        user.cartItems = []; // Set the cart items array to be empty
        const updatedUser = await user.save();
        res.json(updatedUser.cartItems);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if(user) {
        user.cartItems = user.cartItems.filter(item => item.product.toString() !== req.params.productId);
        const updatedUser = await user.save();
        res.json(updatedUser.cartItems);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

module.exports = router;