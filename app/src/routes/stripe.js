const express = require('express');

const stripeRoutes = express.Router();
const ApimService = require('../services/apimService');

const register = (app) => {
  const apim = new ApimService();

  stripeRoutes.get('/checkout', async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    const { subscriptionName } = req.query;
    const { productId } = req.query;
    const { userId } = req.query;

    const { email } = await apim.getUser(userId);

    const product = await apim.getProduct(productId);
    const price = (await stripe.prices.list({ product: product.name, active: true })).data[0].id;

    const lineItem = {
      price,
    };
    if (product.name !== 'payg') {
      lineItem.quantity = 1;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        lineItem,
      ],
      payment_method_types: ['card'],
      success_url: `${process.env.APIM_DEVELOPER_PORTAL_URL}/profile`,
      cancel_url: process.env.APIM_DEVELOPER_PORTAL_URL,
      subscription_data: {
        metadata: {
          userId,
          productName: productId,
          subscriptionName,
        },
      },
    });

    res.redirect(303, session.url);
  });

  stripeRoutes.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log(err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created': {
        const createdSubscription = event.data.object;
        // console.log(createdSubscription)
        const { userId } = createdSubscription.metadata;
        const { subscriptionName } = createdSubscription.metadata;
        const { productName } = createdSubscription.metadata;

        const newSubscription = await apim.createSubscription(
          createdSubscription.id,
          userId,
          subscriptionName,
          productName,
        );
        console.log(newSubscription);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        console.log();
        const subscriptionToChange = event.data.object;

        const { status } = subscriptionToChange;

        if (status === 'canceled' || status === 'unpaid') {
          await apim.deleteSubscription(subscriptionToChange.id);
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
    // res.redirect(303, process.env.APIM_DEVELOPER_PORTAL_URL + '');
  });

  stripeRoutes.post('/unsubscribe', async (req, res) => {
    const { subscriptionId } = req.body;

    const subs = await apim.getSubscription(subscriptionId);

    const productId = subs.scope.split('/').reverse()[0];
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    if (productId === 'payg') {
      await apim.reportUsage();
      stripe.subscriptions.del(subscriptionId);
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    res.redirect(`${process.env.APIM_DEVELOPER_PORTAL_URL}/profile`);
  });

  stripeRoutes.post('/cancel-unsubscribe', async (req, res) => {
    const { subscriptionId } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    res.redirect(`${process.env.APIM_DEVELOPER_PORTAL_URL}/profile`);
  });

  app.use(stripeRoutes);
};

module.exports = { register };
