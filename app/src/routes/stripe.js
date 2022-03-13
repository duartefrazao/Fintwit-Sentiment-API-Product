const { create } = require('domain');
const express = require('express');
const { status } = require('express/lib/response');
const { default: Stripe } = require('stripe');
const { URLSearchParams } = require('url');
const stripe_routes = express.Router();
const ApimService = require('../services/apimService')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const register = (app) =>{
    const apim = new ApimService()

    stripe_routes.get('/checkout', async function(req,res){
        subscriptionName = req.query.subscriptionName
        productId = req.query.productId
        userId = req.query.userId

        const {email} = await apim.get_user(userId)
        
        const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

        const product = await apim.get_product(productId)
        const price = (await stripe.prices.list({product:product.name, active: true})).data[0].id

        const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [
            {
            price: price,
            },
        ],
        payment_method_types: ["card"],
        success_url: process.env.APIM_DEVELOPER_PORTAL_URL + "/apis",
        cancel_url: process.env.APIM_DEVELOPER_PORTAL_URL,
        subscription_data: {
            'metadata': {
                'userId': userId,
                'productName': productId,
                'subscriptionName': subscriptionName
            }
        }
        });

        res.redirect(303, session.url);


    });
    const endpointSecret = "whsec_948ed5c1da4dc18ff6bc289a845ba5cf100b564ac1185064c08c83b671d05b59";

    stripe_routes.post('/webhook',express.raw({ type: 'application/json' }), async function(req,res) {
        const sig = req.headers['stripe-signature'];
        

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.log(err.message)
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
                const createdSubscription = event.data.object;
                console.log(createdSubscription)
                const {userId} = createdSubscription.metadata
                const {subscriptionName} = createdSubscription.metadata
                const {productName} = createdSubscription.metadata
                
                const newSubscription = await apim.createSubscription(createdSubscription.id, userId,subscriptionName,productName)

                break;

            default:
            console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.send();
    })

    app.use(stripe_routes);

}


module.exports = {register};