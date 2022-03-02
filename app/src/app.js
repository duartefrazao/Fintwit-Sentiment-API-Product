const path = require('path')
const express = require('express');
const app = express();
const expressLayouts = require("express-ejs-layouts");


app.use(expressLayouts)
app.set("views", path.join(__dirname, "views"));
app.set('layout', 'pages/layout');
app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, "public")));

require('./routes/routes')(app)

app.listen(8080);
console.log('Server is listening on port 8080');