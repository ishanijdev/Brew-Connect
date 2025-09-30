const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. DEFINE THE SCHEMA FOR AN ITEM IN THE CART (PLACE THIS *BEFORE* userSchema)
const cartItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
});


// 2. THIS IS YOUR ORIGINAL userSchema, NOW WITH THE NEW cartItems FIELD ADDED
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // The new field is now correctly placed inside the original schema
  cartItems: [cartItemSchema],

}, {
  timestamps: true,
});


// THE REST OF YOUR FILE STAYS THE SAME
// This function will run BEFORE a user document is saved to the database
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    next();
  }
  // 'salt' is a random string that makes the hash more secure
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Add a method to the schema to compare entered password with the hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;