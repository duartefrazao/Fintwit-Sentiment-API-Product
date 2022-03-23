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
        returnUrl = req.body.returnUrl || "/"

        try{
            new_user = await apim.signup(email, password, first_name,surname);
        }catch(error){
            const redirectParams = new URLSearchParams()
            redirectParams.append("errorMessage",error.details.details[0].message)
            res.redirect(returnUrl + "&" + redirectParams.toString())
            return 
        }
        
        const identity = await apim.signin(email, password)

        if(!identity.authenticated){
            const redirectParams = new URLSearchParams()
            redirectParams.append("errorMessage", "Wrong email or password.")
            res.redirect(returnUrl + "&" + redirectParams.toString())
            return         
        }

        const { value: token } = await apim.getToken(identity.id);
        

        const searchParams = new URLSearchParams()
        searchParams.append("token",token )
        searchParams.append("returnUrl" ,"/");

        const redirectUrl = process.env.APIM_DEVELOPER_PORTAL_URL + "/signin-sso?" + searchParams.toString();
        
        res.redirect(redirectUrl);
    });

    apim_routes.post('/signin', async function(req, res) {
        
        returnUrl = req.body.returnUrl
        email = req.body.email
        password = req.body.password 

        identity = await apim.signin(email, password)    
        
        if (!identity.authenticated){
            const redirectParams = new URLSearchParams()
            redirectParams.append("errorMessage", "Wrong email or password.")
            res.redirect(returnUrl + "&" + redirectParams.toString())
            return 
        }
        
        const { value: token } = await apim.getToken(identity.id);
        
        const searchParams = new URLSearchParams()
        searchParams.append("token",token )
        searchParams.append("returnUrl" ,"/");

        const redirectUrl = process.env.APIM_DEVELOPER_PORTAL_URL + "/signin-sso?" + searchParams.toString();
    
        res.redirect(redirectUrl);
    });

    apim_routes.post('/closeAccount', async function(req, res) {
        
        email = req.body.email
        password = req.body.password

        var identity;

        try{
            identity = await apim.signin(email, password)    
        }catch(error){
            console.log(error)
            res.statusCode(401).send()
        }


        if (identity.authenticated){
            response = await apim.closeAccount(userId)
        }
        
        
        res.redirect(process.env.APIM_DEVELOPER_PORTAL_URL )
    });

    apim_routes.post('/changePassword', async function(req, res) {
        
        email = req.body.email
        oldPassword = req.body.oldPassword
        newPassword = req.body.newPassword

        /* Validator 
        const redirectParams = new URLSearchParams()
            redirectParams.append("errorMessage", "Wrong email or password.")
            res.redirect(returnUrl + "&" + redirectParams.toString())
            return */

        var identity;

        try{
            identity = await apim.signin(email, oldPassword)    
        }catch(error){
            console.log(error)
            res.statusCode(401).send()
        }

        if (identity.authenticated){
            response = await apim.changePassword(identity.id,email,newPassword)
        }
    
        
        res.redirect(process.env.APIM_DEVELOPER_PORTAL_URL + "/profile")
    });
    apim_routes.get('/apim-delegation', async function(req, res) {
        
        const operation = req.query.operation
        const errorMessage = req.query.errorMessage
        const returnUrl= req._parsedOriginalUrl.path || "/"
        const userId = req.query.userId

        switch(operation){
            case "Subscribe":
                const {productName} = await apim.getProduct(req.query.productId)
                res.render("pages/subscribe", {productId: req.query.productId,productName:productName,userId:req.query.userId})
                break
            case "SignIn":
                res.render("pages/signin",{returnUrl,errorMessage})
                break
            case "SignUp":
                res.render("pages/signup",{returnUrl,errorMessage})
                break
            case "SignOut":
                res.render("pages/index")
                break
            case "Unsubscribe":
                res.render("pages/unsubscribe",{subscriptionId:req.query.subscriptionId})
                break
            case "CloseAccount":
                res.render("pages/closeAccount",{errorMessage,userId})
                break
            case "ChangePassword":
                res.render("pages/changePassword",{errorMessage,userId,returnUrl})
                break
        }
    });

    app.use(apim_routes)
}


module.exports = {register};