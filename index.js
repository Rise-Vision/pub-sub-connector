const http = require('http');
      port = 80;

const podname = process.env.podname;

const requestHandler = (request, response) => {
  response.writeHead(200, {"Content-Type": "application/json"});
  response.end(`Pub Sub Connector: ${podname}`);
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
