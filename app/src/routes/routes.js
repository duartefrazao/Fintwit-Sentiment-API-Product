const auth_routes = require('./authentication')

const register = (app) => {
    app.get('/', function(req, res) {
      res.render('pages/index');
    });

    auth_routes.register(app)
    //app.use('/auth', auth_routes)
    
  };

module.exports = {register}