const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, doctorStripeAccountId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: Math.round(amount * 0.1), // 10% platform fee
      transfer_data: {
        destination: doctorStripeAccountId,
      }
    });
    return paymentIntent;
  } catch (error) {
    throw new Error('Payment intent creation failed: ' + error.message);
  }
};

const createConnectedAccount = async (email) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  } catch (error) {
    throw new Error('Connected account creation failed: ' + error.message);
  }
};

const createAccountLink = async (accountId) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/doctor/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/doctor/stripe/return`,
      type: 'account_onboarding',
    });
    return accountLink;
  } catch (error) {
    throw new Error('Account link creation failed: ' + error.message);
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

const getAccountStatus = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled
    };
  } catch (error) {
    throw new Error('Failed to get account status: ' + error.message);
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentDetails,
  createConnectedAccount,
  createAccountLink,
  getAccountStatus
};