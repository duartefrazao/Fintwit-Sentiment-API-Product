const express = require('express');
const { status } = require('express/lib/response');
const { URLSearchParams } = require('url');
const auth_routes = express.Router();
const ApimService = require('../services/apimService')
const querystring = require("querystring")
const register = (app) =>{
    const apim = new ApimService()

    auth_routes.post('/signup', function(req, res) {
        
        if (req.body == undefined){
            res.send("No body TODO")
            res.end()
        }else{
            try{
                new_user = apim.signup(req.body.email, req.body.password, req.body.name,req.body.surname);
            }catch(error){
                //Error with body
                console.log("Error")
            }
            res.status(200).send()
        }

        
    });

    auth_routes.post('/signin', async function(req, res) {
        


        if (req.body == undefined){
            res.send("No body TODO")
            res.end()
        }else{
            let identity;
            try{
                identity = await apim.signin(req.body.email, req.body.password)
            }catch(error){
                console.log(error)
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
            
        }

        
    });

    app.use('/auth',auth_routes)
}


module.exports = {register};