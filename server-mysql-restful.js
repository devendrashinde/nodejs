import express from 'express';
app = express();
bodyParser = require('body-parser');
port = process.env.PORT || 3000;

app.listen(port);

console.log('API server started on: ' + port);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

import routes from './app/routes/appRoutes'; //importing route
routes(app); //register the route