const msRestNodeAuth = require('@azure/ms-rest-nodeauth');
//import * as msRestNodeAuth from '@azure/ms-rest-nodeauth';
const {ApiManagementClient} = require('@azure/arm-apimanagement');
const {Guid} = require('js-guid');
const { ClientSecretCredential, DefaultAzureCredential, UsernamePasswordCredential } = require("@azure/identity");
const fetch = require('node-fetch')

class ApimService {
    apim_client;

    subscription_id = process.env.SUBSCRIPTION_ID;
    resourceGroupName = process.env.RG_NAME;
    serviceName = process.env.SERVICE_NAME;

    async get_user(userId){
        await this.initialize();

        return await this.apim_client.user.get(this.resourceGroupName,this.serviceName,userId)
    }

    async get_product(productId){
        await this.initialize()

        return await this.apim_client.product.get(this.resourceGroupName,this.serviceName,productId)
    }
    async signup(email,password,firstName, lastName){

        await this.initialize();
        
        
        new_user = await this.apim_client.user.createOrUpdate(
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
        return 
    }
    
    async signin(email,password){
        await this.initialize();
        
        
        const request = this.create_request(email,password)

        const url = `${request.resource_url}/identity?api-version=2019-12-01`
        const response = await fetch(url, { method: "GET", headers: { Authorization: request.credentials } });
        const sas_token = response.headers.get("Ocp-Apim-Sas-Token");
        const identity = await response.json();

        

        return {
            authenticated:true,
            token: sas_token,
            id: identity.id
        }


    }

    async initialize() {
        if (!this.apim_client) {
            const credentials = new ClientSecretCredential(
                process.env.AZURE_AD_SP_TENANT_ID,
                process.env.AZURE_AD_SP_APP_ID, 
                process.env.AZURE_AD_SP_PASSWORD
                );

            this.apim_client = new ApiManagementClient(credentials, this.subscription_id)
        }
    }

    async get_sas_token(id){
        await this.initialize()

        const days_to_expire = 1
        const token_expiration = new Date()
        token_expiration.setDate(token_expiration.getDate() + days_to_expire)

        const token = await this.apim_client.user.getSharedAccessToken(
            process.env.RG_NAME,
            process.env.SERVICE_NAME,
            id,
            {
                expiry:token_expiration,
                keyType:"primary"
            }
        )

        return token.value
    }

    create_request(email,password){
        const credentials = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;
        const url = new URL(process.env.APIM_MANAGEMENT_URL);
        const protocol = url.protocol;
        const hostname = url.hostname;
        const pathname = url.pathname;
        const resource_url = `${protocol}//${hostname}/subscriptions/sid/resourceGroups/rgid/providers/Microsoft.ApiManagement/service/sid${pathname}`;
        return {credentials, resource_url}
    }
}

module.exports = ApimService;