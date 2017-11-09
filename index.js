const express = require('express');
const http = require('http');
const pkg = require("./package.json");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const defaultPort = 80;
const port = process.env.MS_PORT || defaultPort;
const app = express();
const server = http.createServer(app);
const podname = process.env.podname;

app.get('/pubsubconnector', function(req, res) {
  res.send(`Pub Sub Connector: ${podname} ${pkg.version}`);
});

app.post('/pubsubconnector', jsonParser, function(req, res) {
  console.log(`Messages Received ${req.body}`);
  res.send(`Messages Received ${req.body}`);
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
