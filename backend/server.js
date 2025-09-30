const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db.js');

const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const cartRoutes = require('./routes/cartRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');

const User = require('./models/userModel.js');
const Order = require('./models/orderModel.js');

// 1. Load environment variables FIRST
dotenv.config();

// 2. Initialize Stripe and connect to DB AFTER loading variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
connectDB();

const app = express();

// 3. Apply CORS middleware
app.use(cors());

// 4. Stripe webhook route must be BEFORE express.json()

app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  // NEW DEBUGGING LOG
  console.log('--- Webhook Received. Verifying signature... ---');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    // This is the error you are seeing
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('✅ PaymentIntent was successful!');
    
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order && order.status !== 'Successful') {
        order.status = 'Successful';
        order.paidAt = Date.now();
        await order.save();
        console.log(`Order ${order._id} has been marked as Successful.`);

        const user = await User.findById(order.user);
        if (user) {
            user.cartItems = [];
            await user.save();
            console.log(`Cart cleared for user ${user._id}.`);
        }
    }
  }

  res.json({received: true});
});

// 5. General JSON parser for all OTHER routes comes AFTER the webhook
app.use(express.json());

// --- ADD THIS WELCOME ROUTE ---
app.get('/', (req, res) => {
  res.send('API is running...');
});
// -----------------------------

// 6. Define all your other API routes
app.get('/api/config/stripe', (req, res) => {
  res.send({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});