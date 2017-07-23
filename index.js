var db_conn = require("./db_connection");
var express = require('express');
var app = express();
var PORT = 3000;

app.use((req, res, next) => {
  const origin = req.get('origin');

  res.header('Access-Control-Allow-Origin', origin);
  // res.header('Access-Control-Allow-Credentials', true);
  // res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');

  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

app.get('/match/:logical', function(req, res) {
  db_conn.matchLogical(req.params.logical).then(function(result){
    res.send(result);
  }, function (error) {
    res.send(error);
  });
});

app.listen(PORT, function () {
    console.log('Express Server started on port ' + PORT +'!');
});