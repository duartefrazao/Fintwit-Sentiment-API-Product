const express = require('express');
const { URLSearchParams } = require('url');

const apimRoutes = express.Router();
const ApimService = require('../services/apimService');

const register = (app) => {
  const apim = new ApimService();
  apimRoutes.get('/test', async () => {
    apim.reportUsage();
  });
  apimRoutes.post('/signup', async (req, res) => {
    const { email } = req.body;
    const { password } = req.body;
    const { firstName } = req.body;
    const { surname } = req.body;
    const returnUrl = req.body.returnUrl || '/';
    try {
      await apim.signup(email, password, firstName, surname);
    } catch (error) {
      const redirectParams = new URLSearchParams(returnUrl.split('?')[1]);
      redirectParams.get('errorMessage');
      redirectParams.set('errorMessage', error.details.details[0].message);
      redirectParams.get('errorMessage');
      res.redirect(`/apim-delegation?${redirectParams.toString()}`);
      return;
    }

    const identity = await apim.signin(email, password);

    if (!identity.authenticated) {
      const redirectParams = new URLSearchParams(returnUrl.split('?')[1]);
      redirectParams.append('errorMessage', 'Wrong email or password.');
      res.redirect(`/apim-delegation?${redirectParams.toString()}`);
      return;
    }

    const { value: token } = await apim.getToken(identity.id);

    const searchParams = new URLSearchParams();
    searchParams.append('token', token);
    searchParams.append('returnUrl', '/');

    const redirectUrl = `${process.env.APIM_DEVELOPER_PORTAL_URL}/signin-sso?${searchParams.toString()}`;

    res.redirect(redirectUrl);
  });

  apimRoutes.post('/signin', async (req, res) => {
    const { returnUrl } = req.body;
    const { email } = req.body;
    const { password } = req.body;

    const identity = await apim.signin(email, password);

    if (!identity || !identity.authenticated) {
      const redirectParams = new URLSearchParams(returnUrl.split('?')[1]);
      redirectParams.set('errorMessage', identity.message);
      console.log(identity.message);
      res.redirect(`/apim-delegation?${redirectParams.toString()}`);
      return;
    }

    const { value: token } = await apim.getToken(identity.id);

    const searchParams = new URLSearchParams();
    searchParams.append('token', token);
    searchParams.append('returnUrl', '/');

    const redirectUrl = `${process.env.APIM_DEVELOPER_PORTAL_URL}/signin-sso?${searchParams.toString()}`;

    res.redirect(redirectUrl);
  });

  apimRoutes.post('/closeAccount', async (req, res) => {
    const { email } = req.body;
    const { password } = req.body;

    let identity;

    try {
      identity = await apim.signin(email, password);
    } catch (error) {
      res.status(401).send();
      return;
    }

    if (identity.authenticated) {
      await apim.closeAccount(identity.id);
    }

    res.redirect(process.env.APIM_DEVELOPER_PORTAL_URL);
  });

  apimRoutes.post('/changePassword', async (req, res) => {
    const { email } = req.body;
    const { oldPassword } = req.body;
    const { newPassword } = req.body;

    /* Validator
        const redirectParams = new URLSearchParams()
            redirectParams.append("errorMessage", "Wrong email or password.")
            res.redirect(returnUrl + "&" + redirectParams.toString())
            return */

    let identity;

    try {
      identity = await apim.signin(email, oldPassword);
    } catch (error) {
      res.status(401).send();
      return;
    }

    if (identity.authenticated) {
      await apim.changePassword(identity.id, email, newPassword);
    }

    res.redirect(`${process.env.APIM_DEVELOPER_PORTAL_URL}/profile`);
  });

  apimRoutes.get('/apim-delegation', async (req, res) => {
    const { operation } = req.query;
    const { errorMessage } = req.query;
    const returnUrl = req._parsedOriginalUrl.path || '/';
    const { userId } = req.query;

    switch (operation) {
      case 'Subscribe': {
        const { productName } = await apim.getProduct(req.query.productId);
        res.render('pages/subscribe', { productId: req.query.productId, productName, userId: req.query.userId });
        break;
      }
      case 'SignIn':
        res.render('pages/signin', { returnUrl, errorMessage });
        break;
      case 'SignUp':
        res.render('pages/signup', { returnUrl, errorMessage });
        break;
      case 'SignOut':
        res.render('pages/index');
        break;
      case 'Unsubscribe':
        {
          const { subscriptionId } = req.query;

          const subscription = await apim.getSubscription(subscriptionId);

          const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

          /* eslint-disable */

          const { cancel_at_period_end } = await stripe.subscriptions.retrieve(
            subscriptionId,
          );

          if (cancel_at_period_end) {
            res.render('pages/unsubscribe-done', {
              subscriptionName: subscription.displayName,
              subscriptionId,
            });
          } else {
            res.render('pages/unsubscribe', {
              subscriptionName: subscription.displayName,
              subscriptionId,
            });
          }

          /* eslint-enable */
        }
        break;
      case 'CloseAccount':
        res.render('pages/closeAccount', { errorMessage, userId });
        break;
      case 'ChangePassword':
        res.render('pages/changePassword', { errorMessage, userId, returnUrl });
        break;
      default:
        break;
    }
  });

  app.use(apimRoutes);
};

module.exports = { register };
