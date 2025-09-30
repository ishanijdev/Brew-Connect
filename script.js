// =================================================================
// --- MASTER SCRIPT FILE FOR COFFEE LEAF ---
// =================================================================

// --- HELPER FUNCTIONS ---

const getUserInfo = () => {
  return JSON.parse(localStorage.getItem('userInfo'));
};

const renderCartItems = (cartItems) => {
  const cartContainer = document.getElementById('cart-items');
  const totalDisplay = document.getElementById('total-price');
  if (!cartContainer) return;

  cartContainer.innerHTML = '';
  let total = 0;

  if (!cartItems || cartItems.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    totalDisplay.textContent = '';
    return;
  }

  cartItems.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('cart-item-card');
    div.innerHTML = `
      <div class="item-left">
        <img src="${item.imageUrl}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <strong>${item.name}</strong><br>
          <span class="item-price-quantity">₹${item.price} x ${item.quantity}</span>
        </div>
      </div>
      <button class="remove-item-btn" onclick="removeItem('${item.product}')">Remove</button>
    `;
    cartContainer.appendChild(div);
    total += item.price * item.quantity;
  });

  totalDisplay.textContent = `Total: ₹${total.toFixed(2)}`;
};

// --- CORE FEATURES ---

const addToCart = async (product) => {
  const userInfo = getUserInfo();
  showNotification(`${product.name} added to cart!`);

  if (userInfo) {
    try {
      const response = await fetch('https://brew-connect-backend.onrender.com/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      const updatedCart = await response.json();
      updateCartCount(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  } else {
    let cart = JSON.parse(localStorage.getItem('guestCart')) || [];
    const existingItem = cart.find(item => item.product === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        product: product._id, name: product.name, imageUrl: product.imageUrl,
        price: product.price, quantity: 1,
      });
    }
    localStorage.setItem('guestCart', JSON.stringify(cart));
    updateCartCount(cart);
  }
};

const loadCart = async () => {
  const userInfo = getUserInfo();
  let cartItems = [];

  if (userInfo) {
    try {
      const response = await fetch('https://brew-connect-backend.onrender.com/api/cart', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
      });
      cartItems = await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  } else {
    cartItems = JSON.parse(localStorage.getItem('guestCart')) || [];
  }
  
  renderCartItems(cartItems);
  updateCartCount(cartItems);
};

const removeItem = async (productId) => {
  const userInfo = getUserInfo();

  if (userInfo) {
    try {
      const response = await fetch(`https://brew-connect-backend.onrender.com/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
      });
      const updatedCart = await response.json();
      renderCartItems(updatedCart);
      updateCartCount(updatedCart);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  } else {
    let cart = JSON.parse(localStorage.getItem('guestCart')) || [];
    cart = cart.filter(item => item.product !== productId);
    localStorage.setItem('guestCart', JSON.stringify(cart));
    renderCartItems(cart);
    updateCartCount(cart);
  }
};

const clearCart = async () => {
    if (confirm("Are you sure you want to clear the cart?")) {
        const userInfo = getUserInfo();
        if (userInfo) {
            try {
                const response = await fetch('https://brew-connect-backend.onrender.com/api/cart', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` },
                });
                const updatedCart = await response.json();
                renderCartItems(updatedCart);
                updateCartCount(updatedCart);
            } catch (error) {
                console.error('Error clearing cart:', error);
            }
        } else {
            localStorage.removeItem('guestCart');
            loadCart();
        }
    }
};

const loadMenuProducts = async () => {
  const menuGrid = document.querySelector('.menu-grid');
  if (!menuGrid) return;
  try {
    const response = await fetch('https://brew-connect-backend.onrender.com/api/products');
    const products = await response.json();
    menuGrid.innerHTML = '';
    products.forEach(product => {
      const menuItem = document.createElement('div');
      menuItem.classList.add('menu-item');
      menuItem.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span>₹${product.price}</span>
        <button class="cart-btn" onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
      `;
      menuGrid.appendChild(menuItem);
    });
  } catch (error) {
    console.error('Failed to load menu products:', error);
    menuGrid.innerHTML = '<p>Sorry, we could not load the menu at this time.</p>';
  }
};

const suggestCoffee = async (mood, buttonElement) => {
  const resultsGrid = document.getElementById('mood-results-grid');
  const resultsTitle = document.getElementById('mood-results-title');
  if (!resultsGrid || !resultsTitle) return;

  const allMoodButtons = document.querySelectorAll('.mood-btn');
  allMoodButtons.forEach(btn => btn.classList.remove('active'));
  buttonElement.classList.add('active');
  
  const moodText = mood.charAt(0).toUpperCase() + mood.slice(1);
  resultsTitle.innerText = `Recommendations for a "${moodText}" mood:`;
  resultsGrid.innerHTML = '<p>Finding the perfect coffee for you...</p>';

  try {
    const response = await fetch(`https://brew-connect-backend.onrender.com/api/products/mood/${mood}`);
    const recommendedProducts = await response.json();
    resultsGrid.innerHTML = '';
    if (recommendedProducts.length === 0) {
      resultsGrid.innerHTML = '<p>Sorry, we couldn\'t find a match for that mood.</p>';
      return;
    }
    recommendedProducts.forEach(product => {
      const menuItem = document.createElement('div');
      menuItem.classList.add('menu-item');
      menuItem.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span>₹${product.price}</span>
        <button class="cart-btn" onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
      `;
      resultsGrid.appendChild(menuItem);
    });
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    resultsGrid.innerHTML = '<p>Could not load recommendations at this time.</p>';
  }
};

// In scripts.js - Replace your old function with this one

const loadMyOrders = async () => {
  const orderList = document.getElementById('order-history-list');
  if (!orderList) return; // Only run on profile page

  const userInfo = getUserInfo();
  if (!userInfo) {
    window.location.href = 'login.html'; // Redirect if not logged in
    return;
  }

  try {
    const response = await fetch('https://brew-connect-backend.onrender.com/api/orders/myorders', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    const orders = await response.json();

    if (orders.length === 0) {
        orderList.innerHTML = '<p>You have no past orders.</p>';
        return;
    }

    orderList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div><strong>Order ID:</strong> ${order._id}</div>
                <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
                <div><strong>Total:</strong> ₹${order.totalPrice.toFixed(2)}</div>
                
                <div>
                    <strong>Status:</strong> 
                    <span class="status-${order.status.toLowerCase()}">${order.status}</span>
                </div>

            </div>
            <div class="order-body">
                ${order.orderItems.map(item => `
                    <div class="order-item">
                        <img src="${item.imageUrl}" alt="${item.name}">
                        <span>${item.name} (x${item.quantity})</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load orders:', error);
    orderList.innerHTML = '<p>Could not load order history.</p>';
  }
};

// --- AUTHENTICATION ---

const handleRegister = async (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match!'); return;
  }
  try {
    const response = await fetch('https://brew-connect-backend.onrender.com/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('userInfo', JSON.stringify(data));
    window.location.href = 'index.html';
  } catch (error) {
    alert(`Registration failed: ${error.message}`);
  }
};

const handleLogin = async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const response = await fetch('https://brew-connect-backend.onrender.com/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('userInfo', JSON.stringify(data));
    window.location.href = 'index.html';
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
};

const handleLogout = () => {
  localStorage.removeItem('userInfo');
  window.location.href = 'login.html';
};

// --- UI & NOTIFICATIONS ---

const updateNavbar = () => {
  const userInfo = getUserInfo();
  const navLinks = document.querySelector('.nav-links');
  navLinks.innerHTML = `
    <li><a href="/">Home</a></li>
    <li><a href="/menu.html">Menu</a></li>
    <li><a href="/cart.html">Cart <span id="cart-count" class="cart-count-badge">0</span></a></li>
    <li><a href="/mood.html">Mood Selector</a></li>
    <li><a href="/about.html">About</a></li>
    <li><a href="/contact.html">Contact</a></li>
  `;

  if (userInfo) {
    const userLi = document.createElement('li');
    userLi.innerHTML = `<a href="/profile.html">Welcome, ${userInfo.name}</a>`;
    const logoutLi = document.createElement('li');
    const logoutButton = document.createElement('button');
    logoutButton.innerText = 'Logout';
    logoutButton.className = 'logout-btn';
    logoutButton.onclick = handleLogout;
    logoutLi.appendChild(logoutButton);
    navLinks.appendChild(userLi);
    navLinks.appendChild(logoutLi);
  } else {
    const loginLi = document.createElement('li');
    loginLi.innerHTML = `<a href="/login.html">Login</a>`;
    const registerLi = document.createElement('li');
    registerLi.innerHTML = `<a href="/register.html">Register</a>`;
    navLinks.appendChild(loginLi);
    navLinks.appendChild(registerLi);
  }
};

const updateCartCount = (cart) => {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        cartCountElement.textContent = totalItems;
    }
};

const showNotification = (message) => {
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.classList.add('show'); }, 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => { document.body.removeChild(notification); }, 500);
  }, 3000);
};

// --- STRIPE & PAYMENT LOGIC ---

let stripe, cardElement;

const initializePaymentForm = async () => {
  const paymentForm = document.getElementById('payment-form');
  if (!paymentForm) return;

  const cardElementContainer = document.getElementById('card-element-container');
  if (cardElementContainer) cardElementContainer.style.display = 'block'; // Show card form by default

  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
      if (event.target.value === 'card') {
        cardElementContainer.style.display = 'block';
        document.getElementById('button-text').innerText = 'Pay Now';
      } else {
        cardElementContainer.style.display = 'none';
        document.getElementById('button-text').innerText = 'Place Order';
      }
    });
  });

  try {
    const { publishableKey } = await fetch('https://brew-connect-backend.onrender.com/api/config/stripe').then(res => res.json());
    stripe = Stripe(publishableKey);
    const elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
};

const handlePaymentSubmit = async (event) => {
  event.preventDefault();
  const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked').value;
  
  if (selectedPaymentMethod === 'cod') {
    await placeOrder('Cash on Delivery');
  } else {
    await placeOrder('Card');
  }
};

// In scripts.js - REPLACE the placeOrder function
const placeOrder = async (paymentMethod) => {
  const userInfo = getUserInfo();
  if (!userInfo) return alert('Please log in to place an order.');
  
  const location = document.getElementById("location").value;
  if (!location) return alert("Please enter your delivery location.");

  const cartResponse = await fetch('https://brew-connect-backend.onrender.com/api/cart', {
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
  });
  const cartItems = await cartResponse.json();
  if (cartItems.length === 0) return alert("Your cart is empty!");

  const totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

  try {
    const res = await fetch('https://brew-connect-backend.onrender.com/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({
        orderItems: cartItems, shippingAddress: location,
        paymentMethod: paymentMethod, totalPrice: totalPrice,
      }),
    });
    
    const { createdOrder, clientSecret } = await res.json();
    if (!res.ok) throw new Error(createdOrder.message || 'Failed to create order');

    if (paymentMethod === 'Cash on Delivery') {
      alert('Order placed successfully!');
      window.location.href = 'profile.html';
      return;
    }

    if (clientSecret && paymentMethod === 'Card') {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement, billing_details: { name: userInfo.name } },
      });
      
      if (error) {
        // --- NEW: TELL BACKEND THE PAYMENT FAILED ---
        await fetch(`https://brew-connect-backend.onrender.com/api/orders/${createdOrder._id}/fail`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        throw new Error(error.message); // Show the error from Stripe
      }
      
      if (paymentIntent.status === 'succeeded') {
          // The webhook will handle the success, just redirect the user
          alert('Payment successful! Your order is being confirmed.');
          window.location.href = 'profile.html';
      }
    }
  } catch (error) {
    alert(`Action failed: ${error.message}`);
  }
};

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  loadCart();
  loadMenuProducts();
  loadMyOrders();
  initializePaymentForm(); 

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) paymentForm.addEventListener('submit', handlePaymentSubmit);
});