require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testSubscription() {
  try {
    // First create a customer
    const customer = await razorpay.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      contact: '',
      fail_existing: 0,
    });
    console.log('Customer created:', customer.id);

    // Now create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: 'plan_S6zfvOOu5j9WKA',
      total_count: 12,
      customer_notify: 1,
      notes: {
        customer_id: customer.id,
      },
    });
    console.log('Subscription created:', subscription.id);
    console.log('Payment URL:', subscription.short_url);
  } catch (err) {
    console.log('Error:', JSON.stringify(err.error || err, null, 2));
  }
}

testSubscription();
