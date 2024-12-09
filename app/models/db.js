'user strict';

import { createConnection } from 'mysql';

//local mysql db connection
var connection = createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'photos',
    database : 'mydb',
    multipleStatements: true
});

connection.connect(function(err) {
    if (err) throw err;
});

export default connection;
