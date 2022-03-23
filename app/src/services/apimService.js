//const {} = require('@azure/ms-rest-nodeauth');
//import * as msRestNodeAuth from '@azure/ms-rest-nodeauth';
const {ApiManagementClient, UserCreateParameters} = require('@azure/arm-apimanagement');
const {Guid} = require('js-guid');
const { ClientSecretCredential, DefaultAzureCredential} = require("@azure/identity");

const {SecretClient} = require('@azure/keyvault-secrets')

const fetch = require('node-fetch')

class ApimService {
    apimClient //= new ApiManagementClient();
    subscriptionId = process.env.SUBSCRIPTION_ID;
    resourceGroupName = process.env.RG_NAME;
    serviceName = process.env.SERVICE_NAME;

    async getUser(userId){
        await this.init();

        return await this.apimClient.user.get(this.resourceGroupName,this.serviceName,userId)
    }

    async getProduct(productId){
        await this.init()

        return await this.apimClient.product.get(this.resourceGroupName,this.serviceName,productId)
    }
    async signup(email,password,firstName, lastName){

        await this.init();
        
        
        const newUser = await this.apimClient.user.createOrUpdate(
            this.resourceGroupName,
            this.serviceName,
            Guid.newGuid().toString(),
            {
                email,
                firstName,
                lastName,
                password
            }
            );
        return newUser
    }
    
    async signin(email,password){
        await this.init();

        var request;
        try{
            request = this.createRequest(email,password)
        }catch(error){
            console.log(request)
        }

        const url = `${request.resourceUrl}/identity?api-version=2019-12-01`
        const response = await fetch(url, { method: "GET", headers: { Authorization: request.credentials } });
        if(response.status == 401){
            return {authenticated:false}
        }

        const token = response.headers.get("Ocp-Apim-Sas-Token");
        
        const identity = await response.json();   
        
        return {
            authenticated:true,
            token: token,
            id: identity.id
        }

    }

    async init() {
        if (!this.apimClient) {
            const credentials = new ClientSecretCredential(
                process.env.AZURE_AD_SP_TENANT_ID,
                process.env.AZURE_AD_SP_APP_ID, 
                process.env.AZURE_AD_SP_PASSWORD
                );

            this.apimClient = new ApiManagementClient(credentials, this.subscriptionId)
        }
    }

    async getToken(id){
        await this.init()

        const daysToExpire = 1
        const tokenExpiration = new Date()
        tokenExpiration.setDate(tokenExpiration.getDate() + daysToExpire)

        const token = await this.apimClient.user.getSharedAccessToken(
            process.env.RG_NAME,
            process.env.SERVICE_NAME,
            id,
            {
                expiry:tokenExpiration,
                keyType:"primary"
            }
        )

        return token
    }

    async createSubscription(stripeSubscriptionId,userId, subscriptionName,productName){
        await this.init()

        console.log(stripeSubscriptionId,userId,subscriptionName,productName)
        return await this.apimClient.subscription.createOrUpdate(
            this.resourceGroupName,
            this.serviceName,
            stripeSubscriptionId,
            {
                displayName:subscriptionName,
                ownerId:`/users/${userId}`,
                scope: `/products/${productName}`,
                state:'active'
            }
        )

    }

    async deleteSubscription(subscriptionId){
        await this.init()

        return await this.apimClient.subscription.delete(this.resourceGroupName,this.serviceName,subscriptionId,'suspended');

    }

    async closeAccount(userId){
        await this.init()
       
        return await this.apimClient.user.delete(this.resourceGroupName,this.serviceName,userId,"*")
    }

    async changePassword(userId,email,newPassword){
        await this.init()

        const profile = await this.apimClient.user.get(this.resourceGroupName,this.serviceName,userId)
        return await this.apimClient.user.createOrUpdate(
            this.resourceGroupName,
            this.serviceName,
            userId,
            {
                email,
                password:newPassword,
                firstName:profile.firstName,
                lastName:profile.lastName
            })
    }
    
    async checkEmail(userId){
        await this.init()


        return await this.apimClient.user.get(this.resourceGroupName,this.serviceName,userId)
    }

    createRequest(email,password){
        const credentials = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;
        const url = new URL(process.env.APIM_MANAGEMENT_URL);
        const protocol = url.protocol;
        const hostname = url.hostname;
        const pathname = url.pathname;
        const resourceUrl = `${protocol}//${hostname}/subscriptions/sid/resourceGroups/rgid/providers/Microsoft.ApiManagement/service/sid${pathname}`;
        return {credentials, resourceUrl}
    }
}

module.exports = ApimService;