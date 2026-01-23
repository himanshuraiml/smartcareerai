require('dotenv').config();
const Razorpay = require('razorpay');

console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.log('Credentials missing!');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Try to fetch a plan to test credentials
razorpay.plans.fetch('plan_S6zfvOOu5j9WKA')
  .then(plan => {
    console.log('Plan fetched successfully:', plan.item.name, '-', plan.item.amount/100, plan.item.currency);
  })
  .catch(err => {
    console.log('Error:', err.error ? err.error.description : err.message);
  });
