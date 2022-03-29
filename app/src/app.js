const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { CronJob } = require('cron');
const routes = require('./routes/routes');
const StripeService = require('./services/stripeService');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'pages/layout');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// require('./routes/routes')(app)
routes.register(app);

const port = (process.env.PORT || 8000);
app.listen(port);

const cron = new CronJob(
  '0 0 * * *',
  async () => {
    await (new StripeService()).reportUsage();
  },
  null,
  true,
  'Europe/London',
);

console.log(`Cron reporting api usage daily is ${cron.running ? 'running' : 'stopped'}.`);

console.log(`Server is listening on port ${port}`);
