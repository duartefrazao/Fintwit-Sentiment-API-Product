const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '../.env' });

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const productsInfo = JSON.parse(fs.readFileSync('./productsInfo.json', 'utf8'));
const createObjects = async function () {
  for (const product of productsInfo) {
    const { price } = product;

    try {
      await stripe.products.retrieve(
        product.id,
      );
    } catch (error) {
      await stripe.products.create({
        name: product.name,
        id: product.id,
        description: product.description,
      });
      await stripe.prices.create({
        currency: 'eur',
        product: product.id,
        unit_amount: price.unit_amount,
        recurring: {
          interval: price.recurring.interval,
          interval_count: price.recurring.interval_count,
          usage_type: price.recurring.usage_type,
        },
      });
    }
    await stripe.products.update(product.id, {
      name: product.name,
      description: product.description,
    });

    const priceId = (await stripe.prices.list({ active: true, product: product.id })).data[0].id;
    await stripe.prices.update(priceId, {
      active: false,
    });

    await stripe.prices.create({
      currency: 'eur',
      product: product.id,
      unit_amount: price.unit_amount,
      recurring: {
        interval: price.recurring.interval,
        interval_count: price.recurring.interval_count,
        usage_type: price.recurring.usage_type,
      },
    });
  }
};

const run = async function () {
  await createObjects();
};

run();
