const apim_routes = require('./apim')
const stripe_routes = require('./stripe')
const register = (app) => {
    app.get('/', function(req, res) {
      res.render('pages/index');
    });

    stripe_routes.register(app)
    apim_routes.register(app)
    //app.use('/auth', auth_routes)
    
  };

module.exports = {register}