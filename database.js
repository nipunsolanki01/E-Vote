const dotenv = require('dotenv');

dotenv.config({path : './.env'});

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: process.env.DATABASE_HOST, // assign your host name
  user: process.env.DATABASE_USER,      //  assign your database username
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE // assign database Name
});

conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});

module.exports = conn;
