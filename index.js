const express = require("express");
const http = require("http");
const pkg = require("./package.json");
const bodyParser = require("body-parser");
const connector = require("./src/connector");
const jsonParser = bodyParser.json();
const defaultPort = 80;
const port = process.env.PSC_PORT || defaultPort;
const app = express();
const server = http.createServer(app);
const podname = process.env.podname;


app.get('/pubsubconnector', function(req, res) {
  res.send(`Pub Sub Connector: ${podname} ${pkg.version}`);
});

app.post('/pubsubconnector', jsonParser, connector.handleRequest);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
})
