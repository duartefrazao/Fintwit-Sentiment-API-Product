const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const expressLayouts = require("express-ejs-layouts");
const routes = require('./routes/routes')
dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(expressLayouts)
app.set("views", path.join(__dirname, "views"));
app.set('layout', 'pages/layout');
app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, "public")));

//require('./routes/routes')(app)
routes.register(app)

app.listen(8080);
console.log('Server is listening on port 8080');