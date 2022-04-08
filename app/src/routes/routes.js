const apimRoutes = require('./apim');
const stripeRoutes = require('./stripe');

const register = (app) => {

  stripeRoutes.register(app);
  apimRoutes.register(app);
};

module.exports = { register };
