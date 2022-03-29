const { ApiManagementClient } = require('@azure/arm-apimanagement');
const { Guid } = require('js-guid');
const { ClientSecretCredential } = require('@azure/identity');
const axios = require('node-fetch');

class ApimService {
  apimClient;// = new ApiManagementClient();

  subscriptionId = process.env.SUBSCRIPTION_ID;

  resourceGroupName = process.env.RG_NAME;

  serviceName = process.env.SERVICE_NAME;

  async getUser(userId) {
    await this.init();

    return this.apimClient.user.get(this.resourceGroupName, this.serviceName, userId);
  }

  async getProduct(productId) {
    await this.init();

    return this.apimClient.product.get(this.resourceGroupName, this.serviceName, productId);
  }

  async signup(email, password, firstName, lastName) {
    await this.init();

    const newUser = await this.apimClient.user.createOrUpdate(
      this.resourceGroupName,
      this.serviceName,
      Guid.newGuid().toString(),
      {
        email,
        firstName,
        lastName,
        password,
      },
    );
    return newUser;
  }

  async signin(email, password) {
    await this.init();

    let request;
    try {
      request = this.createRequest(email, password);
    } catch (error) {
      console.log(request);
    }

    const url = `${request.resourceUrl}/identity?api-version=2019-12-01`;
    const response = await axios(url, { method: 'GET', headers: { Authorization: request.credentials } });

    if (response.status === 401) {
      return { authenticated: false, message: 'Wrong email or password.' };
    }
    if (response.status === 429) {
      return { authenticated: false, message: 'Too many tries, try again later.' };
    }

    const token = response.headers.get('Ocp-Apim-Sas-Token');

    const identity = await response.json();

    return {
      authenticated: true,
      token,
      id: identity.id,
    };
  }

  async init() {
    if (!this.apimClient) {
      const credentials = new ClientSecretCredential(
        process.env.AZURE_AD_SP_TENANT_ID,
        process.env.AZURE_AD_SP_APP_ID,
        process.env.AZURE_AD_SP_PASSWORD,
      );

      this.apimClient = new ApiManagementClient(credentials, this.subscriptionId);
    }
  }

  async getToken(id) {
    await this.init();

    const daysToExpire = 1;
    const tokenExpiration = new Date();
    tokenExpiration.setDate(tokenExpiration.getDate() + daysToExpire);

    const token = await this.apimClient.user.getSharedAccessToken(
      process.env.RG_NAME,
      process.env.SERVICE_NAME,
      id,
      {
        expiry: tokenExpiration,
        keyType: 'primary',
      },
    );

    return token;
  }

  async createSubscription(stripeSubscriptionId, userId, subscriptionName, productName) {
    await this.init();

    return this.apimClient.subscription.createOrUpdate(
      this.resourceGroupName,
      this.serviceName,
      stripeSubscriptionId,
      {
        displayName: subscriptionName,
        ownerId: `/users/${userId}`,
        scope: `/products/${productName}`,
        state: 'active',
      },
    );
  }

  async deleteSubscription(subscriptionId) {
    await this.init();

    return this.apimClient.subscription.delete(this.resourceGroupName, this.serviceName, subscriptionId, 'suspended');
  }

  async updateSubscription(subscriptionId) {
    await this.init();

    return this.apimClient.subscription.delete(this.resourceGroupName, this.serviceName, subscriptionId, 'suspended');
  }

  async getSubscription(subscriptionId) {
    await this.init();

    return this.apimClient.subscription.get(
      this.resourceGroupName,
      this.serviceName,
      subscriptionId,
    );
  }

  async closeAccount(userId) {
    await this.init();

    return this.apimClient.user.delete(this.resourceGroupName, this.serviceName, userId, '*', { deleteSubscriptions: true });
  }

  async changePassword(userId, email, newPassword) {
    await this.init();

    const profile = await this.apimClient.user.get(
      this.resourceGroupName,
      this.serviceName,
      userId,
    );

    return this.apimClient.user.createOrUpdate(
      this.resourceGroupName,
      this.serviceName,
      userId,
      {
        email,
        password: newPassword,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    );
  }

  async checkEmail(userId) {
    await this.init();

    return this.apimClient.user.get(this.resourceGroupName, this.serviceName, userId);
  }

  async reportUsage() {
    await this.init();

    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    const priceId = (await stripe.prices.list({ active: true, product: 'payg' })).data[0].id;

    const subscriptions = await stripe.subscriptions.list({
      price: priceId,
    });
    const currentTime = new Date();
    const currentTimeISO = Math.floor(currentTime.getTime() / 1000);

    for (const subscription of subscriptions.data) {
      const subscriptionId = subscription.id;

      const subscriptionPriceID = subscription.items.data[0].id;

      let lastUsageReportDate;
      if (subscription.metadata.lastUsageReportDate) {
        lastUsageReportDate = new Date(subscription.metadata.lastUsageReportDate * 1000);
      } else {
        lastUsageReportDate = new Date(subscription.current_period_start * 1000);
      }

      const filter = `timestamp ge datetime'${lastUsageReportDate.toISOString()
      }' and timestamp le datetime'${currentTime.toISOString()}' and subscriptionId eq '${subscriptionId}'`;

      const report = await this.apimClient.reports.listBySubscription(
        this.resourceGroupName,
        this.serviceName,
        filter,
      );

      const callTotal = (await report.next()).value.callCountTotal;
      const usageUnits = Math.floor(callTotal / 100);

      if (usageUnits !== 0) {
        await stripe.subscriptionItems.createUsageRecord(
          subscriptionPriceID,
          { quantity: usageUnits, timestamp: currentTimeISO },
        );

        await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            lastUsageReportDate: currentTimeISO,
          },
        });
      }
    }
  }

  createRequest = (email, password) => {
    const credentials = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;
    const url = new URL(process.env.APIM_MANAGEMENT_URL);
    const { protocol } = url;
    const { hostname } = url;
    const { pathname } = url;
    const resourceUrl = `${protocol}//${hostname}/subscriptions/sid/resourceGroups/rgid/providers/Microsoft.ApiManagement/service/sid${pathname}`;
    return { credentials, resourceUrl };
  };
}

module.exports = ApimService;
