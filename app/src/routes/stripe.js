const express = require('express');
const { status } = require('express/lib/response');
const { URLSearchParams } = require('url');
const stripe_routes = express.Router();
const ApimService = require('../services/apimService')


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
        customer_email: userEmail,
        line_items: [
            {
            price: price,
            },
        ],
        payment_method_types: ["card"],
        success_url: process.env.APIM_DEVELOPER_PORTAL_URL + "/apis",
        cancel_url: process.env.APIM_DEVELOPER_PORTAL_URL,
        subscription_data: {
            metadata: {
                [ApimUserIdKey]: userId,
                [ApimProductIdKey]: productId,
                [ApimSubscriptionNameKey]: subscriptionName
            }
        }
        });

        res.redirect(303, session.url);


    });

}


module.exports = {register};