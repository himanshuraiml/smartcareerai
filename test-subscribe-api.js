require('dotenv').config();
const jwt = require('jsonwebtoken');

// Create a test JWT
const token = jwt.sign(
  { id: '76d36724-366d-4000-b32b-c98d8de2e829', email: 'test@example.com', role: 'USER' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Making request to billing service...');

fetch('http://localhost:3010/subscriptions/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ planName: 'starter' })
})
.then(async res => {
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err));
