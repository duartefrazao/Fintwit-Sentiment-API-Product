# Fintwit Sentiment
A web app that provides a paid API product to help investors identify periods of euphoria and fear in the stock market by providing engagement and sentiment metrics from Fintwit (Financial Twitter) community.
API access keys can be purchased through a Stripe payment portal with fixed or pay as you go subscriptions.

It uses the official Twitter API to retrieve tweets from the top community members and their respective replies. The sentiment is computer using Azure Cognitive Services.

This information is available through a Stripe payment portal. The user can choose between two types of subscriptions: 
- Fixed monthly/yearly - fixed payment with a limited number of API calls
- Pay as you go - unlimited API calls only restricted by the amount of calls it can do per minute. The app communicates the usage to Stripe daily as is billed monthly.



### Structure of the project
The front facing api uses Azure API Management to filter requests, manage quotas and secure the backend service. 
A separate containerized service was built with Azure Webapps and NodeJS to manage the functionality around authentication, subscriptions and Stripe.
The backend is a serverless API built with Azure Functions that retrieves information from a CosmosDB database (Mongo API).
For the twitter data it uses tweepy (Twitter API v2) to fetch data and Azure Cognitive Services to compute the sentiment score.
The project is automated with IAC by using ARM templates.
CI/CD pipelines were built with Github Actions to provide:
- Testing and production environment 
- Infrastructure automation (ARM templates, docker)
- Test / Lint

The most important technologies/services used were:

- Azure API Management
- Azure Functions
- Azure CosmosDB (Mongo)
- Azure Cognitive Services (Text Analytics)
- ARM templates (IAC)
- Stripe
- Github Actions (CI/CD)
- Docker

Other services used:
- NodeJS and Python
- Tweepy
- Jest
- Azure Webapps
- Azure Storage Accout


### How to initialize the project from the start

- Get a Twitter Developer account and save the bearer token.
- Setup your Stripe account
    - Initialization key 
        - Read/Write in Prices, Products and Webhook Endpoints
    - App key 
        - Read/Write in Checkout Sessions, Subscriptions and Usage Records
        - Read Only in Prices and Proucts
    - Webhook - Listening for customer (created, deleted and updated) events with the endpoint:
        - `<delegation-app-url>/webhook`

- Run the initiateStripe script (app folder) to create the subscriptions in Stripe. 
- Create a resource group named **api**.
- Create a Service Principal and assign the owner role to the resource group, save the information from the output.
    - ``` az ad sp create-for-rbac --name <name-for-service-principal> --skip-assignment ```
    - ``` az ad sp show --id "<id-of-your-service-principal>" ```

- In the deployment folder run the deployment of the base infrastructure:
    - ``` az deployment group create --name deployStorage --resource-group api --template-file  storage.json ```

- Save the **output** object. It contains information needed to connect to the storage account, CosmosDB and Cognitive Services.
- Fill in the parameter files in the deployment folder with the output, the service principal, the information from stripe and from Twitter.
- Fill in the .env file in the app folder.
- From the root run:
    - ```sh deployment/uploadAll.sh prod```
    - Nested arm templates and the api definition need to be hosted online. This will update the necessary files for IAC deployment to work.

- From the deployment folder run the deployment of the infrastructure:
    ```az deployment group create --name deploy --resource-group api --template-file  main.json --parameters main.parameters.json```

After having deployed the infrastructure one time, the Github Actions pipelines are used to deploy the code automatically from the repository.
