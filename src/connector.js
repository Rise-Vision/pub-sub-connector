const rp = require('request-promise-native');

const sendMessage = (type, attributes) => {
  const options = {
        uri: 'http://messaging-service/pubsub',
        body: {
                "filePath": `${attributes.bucketId}/${attributes.objectId}`,
                "version": `${attributes.objectGeneration}`,
                type
               },
        json: true
  };
  return rp.post(options);
}

const handleFinalize = (attributes) => {
  if (attributes.overwroteGeneration) {
     return sendMessage("UPDATE", attributes);
  }
     return sendMessage("ADD", attributes);

}

const handleDelete = (attributes) => {
  if (!attributes.overwrittenByGeneration) {
    return sendMessage("DELETE", attributes);
  }
    return Promise.resolve();

}

const handleBody = (body) => {
  const attributes = body.message.attributes;

  switch (attributes.eventType) {
    case "OBJECT_DELETE":
      return handleDelete(attributes);
    case "OBJECT_FINALIZE":
      return handleFinalize(attributes);
    default:
      return Promise.reject(new Error("Not a valid eventType"));
  }
}

const handleRequest = (req, res) => {
  console.log(`Messages Received ${JSON.stringify(req.body)}`);
  const CLIENT_ERROR_CODE = 400;
  const MS_SERVER_ERROR_CODE = 502;
  const SUCCESS_CODE = 200;

  const body = req.body;

  if (!body || !body.message || !body.message.attributes || !body.message.attributes.eventType) {
    res.sendStatus(CLIENT_ERROR_CODE);
  } else {
    handleBody(body).then(()=>{
      res.sendStatus(SUCCESS_CODE);
    }).catch((error)=>{
      console.log("Error from MS", error);
      res.sendStatus(MS_SERVER_ERROR_CODE);
    });
  }
}

module.exports = {
  handleRequest
}