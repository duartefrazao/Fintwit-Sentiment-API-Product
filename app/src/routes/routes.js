const apimRoutes = require('./apim');
const stripeRoutes = require('./stripe');

const register = (app) => {
  app.get('/', (req, res) => {
    res.render('pages/index');
  });

  stripeRoutes.register(app);
  apimRoutes.register(app);
};

module.exports = { register };
