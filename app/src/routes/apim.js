const express = require('express');
const { status } = require('express/lib/response');
const { URLSearchParams } = require('url');
const apim_routes = express.Router();
const ApimService = require('../services/apimService')


const register = (app) =>{
    const apim = new ApimService()

    
    apim_routes.post('/signup', async function(req, res) {
        
        email = req.body.email
        password = req.body.password
        first_name = req.body.name
        surname = req.body.surname

        try{
            new_user = await apim.signup(email, password, first_name,surname);
        }catch(error){
            //Error with body
            console.log(error)
        }
        
        identity = await apim.signin(email, password)
        if(!identity.authenticated){
            console.log("TODO")
        }
        const { value: token } = await apim.get_sas_token(identity.id);
        

        const searchParams = new URLSearchParams()
        searchParams.append("token",token )
        searchParams.append("returnUrl" ,"/");

        const redirectUrl = process.env.APIM_DEVELOPER_PORTAL_URL + "/signin-sso?" + searchParams.toString();
        
        res.redirect(redirectUrl);
    });

    apim_routes.post('/signin', async function(req, res) {
        
        try {
            identity = await apim.signin(req.body.email, req.body.password)    
        } catch (error) {
            res.status(401).send("Unauthorized")
            return
        }
        
        if(!identity.authenticated){
            console.log("TODO")
        }

        const { value: token } = await apim.get_sas_token(identity.id);
        
        const searchParams = new URLSearchParams()
        searchParams.append("token",token )
        searchParams.append("returnUrl" ,"/");

        const redirectUrl = process.env.APIM_DEVELOPER_PORTAL_URL + "/signin-sso?" + searchParams.toString();
    
        res.redirect(redirectUrl);
            
        

        
    });

  

    apim_routes.get('/apim-delegation', async function(req, res) {
        
        const operation = req.query.operation

        
        switch(operation){
            case "Subscribe":
                const {productName} = await apim.get_product(req.query.productId)
                res.render("pages/subscribe", {productId: req.query.productId,productName:productName,userId:req.query.userId})
                break
            case "SignIn":
                res.render("pages/signin")
                break
            case "SignOut":
                res.render("pages/index")
                break
        }
            


        /* subscription = req.body.subscriptionName

        const {email} = apim.get_user(req.body.userId)

        const searchParams = new URLSearchParams()
        searchParams.append(userId,req.body.userId)
        searchParams.append(userEmail,req.body.userEmail)
        searchParams.append(productId,req.body.productId)
        searchParams.append(subscriptionName,req.body.subscriptionName)
 */
        //TODO - validate request


        
    });

    app.use(apim_routes)
}


module.exports = {register};