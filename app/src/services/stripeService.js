const ApimService = require('./apimService');

class StripeService {
  apim = new ApimService();

  async reportUsageSubscription(subscriptionId, subscription, stripe) {
    const subscriptionPriceID = subscription.items.data[0].id;

    const currentTime = new Date();
    const currentTimeISO = Math.floor(currentTime.getTime() / 1000);

    let lastUsageReportDate;
    if (subscription.metadata.lastUsageReportDate) {
      lastUsageReportDate = new Date(subscription.metadata.lastUsageReportDate * 1000);
    } else {
      lastUsageReportDate = new Date(subscription.current_period_start * 1000);
    }

    const filter = `timestamp ge datetime'${lastUsageReportDate.toISOString()
    }' and timestamp le datetime'${currentTime.toISOString()}' and subscriptionId eq '${subscriptionId}'`;

    await this.apim.init()
    const report = await this.apim.apimClient.reports.listBySubscription(
      this.apim.resourceGroupName,
      this.apim.serviceName,
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

  async reportUsage() {
    await this.apim.init();
    
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

    const priceId = (await stripe.prices.list({ active: true, product: 'payg' })).data[0].id;

    const subscriptions = await stripe.subscriptions.list({
      price: priceId,
    });

    for (const subscription of subscriptions.data) {
      await this.reportUsageSubscription(subscription.id, subscription, stripe);
    }
  }
}

module.exports = StripeService;
