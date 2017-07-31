var db_conn = require("./db_connection");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = 3000;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use((req, res, next) => {
  const origin = req.get('origin');

  res.header('Access-Control-Allow-Origin', origin);
  // res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');

  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

app.get('/fetch', function(req, res) {
  db_conn.fetchData().then(function(result) {
    res.send(result);
  }, function(error) {
    res.send(error);
  })
});

app.delete('/request/decline', function(req,res) {
  db_conn.declineRequest(req.query.id).then(function(result) {
    res.send(result);
  }, function (error) {
    res.send(error)
  });
});

app.get('/request/fetch', function(req, res) {
  db_conn.fetchRequest().then(function(result) {
    res.send(result);
  }, function(error) {
    res.send(error);
  })
});

app.get('/match/:logical', function(req, res) {
  db_conn.matchLogical(req.params.logical).then(function(result){
    res.send(result);
  }, function (error) {
    res.send(error);
  });
});

app.post('/request/insert', function(req,res) {
  db_conn.requestInsert(req.body.params).then(function(result) {
    res.send(result);
  }, function (error) {
    res.send(error)
  });
});

app.put('/request/update', function(req,res) {
  db_conn.requestUpdate(req.body.params).then(function(result) {
    res.send(result);
  }, function (error) {
    res.send(error)
  });
});

app.put('/request/approve', function(req,res) {
  db_conn.approveRequest(req.body.params).then(function(result) {
    res.send(result);
  }, function (error) {
    res.send(error)
  });
});

app.delete('/request/delete', function(req,res) {
  db_conn.requestDelete(req.query).then(function(result) {
    res.send(result);
  }, function (error) {
    res.send(error)
  });
});


app.listen(PORT, function () {
    console.log('Express Server started on port ' + PORT +'!');
});