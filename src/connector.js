const rp = require('request-promise-native');
const gkeHostname = "messaging-service"
const msHost = process.env.NODE_ENV === "test" ? "127.0.0.1:8081" : gkeHostname;

const sendMessage = (type, attributes) => {
  const options = {
      uri: `http://${msHost}/messaging/pubsub`,
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

const handleMetadataUpdate = (attributes, base64Data) => {
  const data = Buffer.from(base64Data, 'base64').toString('utf8');
  const gcsObject = JSON.parse(data);
  const metadata = gcsObject.metadata;

  console.log(`Handling metadata update: ${JSON.stringify(metadata)}`);

  if (metadata && metadata.trashed === 'true') {
    return sendMessage("DELETE", attributes);
  }
  return sendMessage("ADD", attributes);
}

const handleBody = (body) => {
  const attributes = body.message.attributes;

  switch (attributes.eventType) {
    case "OBJECT_DELETE":
      return handleDelete(attributes);
    case "OBJECT_FINALIZE":
      return handleFinalize(attributes);
    case "OBJECT_METADATA_UPDATE":
      return handleMetadataUpdate(attributes, body.message.data);
    default:
      console.warn(`Unexpected event type ${attributes.eventType}`);
      return Promise.resolve();
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
    handleBody(body).then((response)=>{
      console.log(`Response from MS ${JSON.stringify(response)}`);
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
