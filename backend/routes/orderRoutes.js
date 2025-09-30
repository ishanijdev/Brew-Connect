const express = require('express');
const { protect } = require('../middleware/authMiddleware.js');
const Order = require('../models/orderModel.js');
const User = require('../models/userModel.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post('/', protect, async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const order = new Order({
    orderItems, user: req.user._id, shippingAddress,
    paymentMethod, totalPrice, status: 'Pending'
  });

  const createdOrder = await order.save();

  if (paymentMethod === 'Card') {
    const amountInCents = Math.round(totalPrice * 100);
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, currency: 'inr', // Or your chosen currency
        payment_method_types: ['card'],
        metadata: { orderId: createdOrder._id.toString() },
      });
      createdOrder.paymentIntentId = paymentIntent.id;
      await createdOrder.save();
      res.status(201).json({ createdOrder, clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ message: 'Stripe Error: ' + error.message });
    }
  } else { // For Cash on Delivery
    // --- THIS IS THE FIX ---
    createdOrder.status = 'Successful';
    await createdOrder.save();
    
    const user = await User.findById(req.user._id);
    if (user) {
      user.cartItems = [];
      await user.save();
    }
    res.status(201).json({ createdOrder });
  }
});

router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
});

router.put('/:id/fail', protect, async (req, res) => {
    const order = await Order.findById(req.params.id);
    if(order) {
        order.status = 'Failed';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

module.exports = router;