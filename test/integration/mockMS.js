const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const port = 8081
const app = express();
const server = http.createServer(app);


const start = (handler, cb)=>{

  app.post('/messaging/pubsub', jsonParser, handler);

  server.listen(port, (err) => {
    if (err) {
      console.log('something bad happened', err);
      return cb(err);
    }
    console.log(`server is listening on ${port}`);
    return cb();
  })
}

const stop = ()=>{
  server.close();
}

module.exports = {
  start,
  stop
}
