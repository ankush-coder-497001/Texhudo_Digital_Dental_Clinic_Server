const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure whole number
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      }
    });
    return paymentIntent;
  } catch (error) {
    throw new Error('Payment intent creation failed: ' + error.message);
  }
};

const getPaymentDetails = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId
    });
    
    return {
      paymentIntent,
      receiptUrl: charges.data[0]?.receipt_url
    };
  } catch (error) {
    throw new Error('Failed to get payment details: ' + error.message);
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentDetails
};