const express = require("express");
const rp = require('request-promise');
const http = require("http");
const pkg = require("./package.json");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const defaultPort = 80;
const port = process.env.PSC_PORT || defaultPort;
const app = express();
const server = http.createServer(app);
const podname = process.env.podname;

function sendMessage(type, attributes) {
  const options = {
        method: 'POST',
        uri: 'http://messaging-service',
        body: {
                "message" : {
                              "filePath": `${attributes.bucketId}/${attributes.objectId}`,
                              "version": `${attributes.objectGeneration}`,
                              "type": type
                            }
              },
        json: true
  };
  return rp(options);
}

function handleFinalize(attributes) {
  if(attributes.overwroteGeneration){
     return sendMessage("UPDATE", attributes);
  } else {
     return sendMessage("ADD", attributes);
  }
}

function handleDelete(attributes) {
  return new Promise((resolve, reject) => {
    if(!attributes.overwrittenByGeneration){
      return sendMessage("DELETE", attributes);
    } else {
      return resolve();
    }
  });
}

function handleRequest(body) {

  //return new Promise((resolve, reject) => {
    const clientErrorCode = 400;
    if(!body || !body.message || !body.message.attributes) return reject(clientErrorCode);

    const attributes = body.message.attributes;

    switch (attributes.eventType) {
      case "OBJECT_DELETE":
        return handleDelete(attributes);
        break;
      case "OBJECT_FINALIZE":
        return handleFinalize(attributes);
        break;
    }
  //});
}

app.get('/pubsubconnector', function(req, res) {
  res.send(`Pub Sub Connector: ${podname} ${pkg.version}`);
});

app.post('/pubsubconnector', jsonParser, function(req, res) {
  console.log(`Messages Received ${JSON.stringify(req.body)}`);

  handleRequest(req.body).then(()=>{
    res.sendStatus(200)
  }).catch((errorCode)=>{
    res.sendStatus(errorCode)
  });
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
