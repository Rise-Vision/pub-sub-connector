/* eslint-env mocha */
/* eslint max-statements: ["error", 10, { "ignoreTopLevelFunctions": true }] */
const assert = require("assert");
const simple = require("simple-mock");
const connector = require("../../src/connector");
const rp = require('request-promise-native');
const CLIENT_ERROR_CODE = 400;
const MS_SERVER_ERROR_CODE = 502;
const SUCCESS_CODE = 200;
let res = {};

describe("Connector", ()=>{
  let resPromise = null;
  let req = {};

  beforeEach(()=>{
    req = {
      body: {
        message: {
          attributes: {
            objectId: 1111,
            bucketId: 1111,
            objectGeneration: 1111,
            eventType: "OBJECT_FINALIZE"}
        }
      }
    };

    simple.mock(rp, "post").resolveWith();

    resPromise = new Promise(resolve=>{
      res = {sendStatus: resolve};
    });
  });

  afterEach(()=>{
    simple.restore()
  });

  it("return success when it can send message to MS", ()=>{
    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, SUCCESS_CODE);
    });
  });

  it("send message with objectId, bucketId, objectGeneration and ADD type", ()=>{
    connector.handleRequest(req, res);

    assert.deepEqual(rp.post.lastCall.args[0].body, {
      "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
      "version": `${req.body.message.attributes.objectGeneration}`,
      "type": "ADD"
    });
  });

  it("send message with objectId, bucketId, objectGeneration and DELETE type", ()=>{
    req.body.message.attributes.eventType = "OBJECT_DELETE";

    connector.handleRequest(req, res);

    assert.deepEqual(rp.post.lastCall.args[0].body, {
      "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
      "version": `${req.body.message.attributes.objectGeneration}`,
      "type": "DELETE"
    })
  });

  it("send message with objectId, bucketId, objectGeneration and UPDATE type", ()=>{
    req.body.message.attributes.overwroteGeneration = 1111;

    connector.handleRequest(req, res);

    assert.deepEqual(rp.post.lastCall.args[0].body, {
      "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
      "version": `${req.body.message.attributes.objectGeneration}`,
      "type": "UPDATE"
    })
  });

  it("skip sending message when there are a event type OBJECT_DELETE and a overwrittenByGeneration attribute", ()=>{
    req.body.message.attributes.eventType = "OBJECT_DELETE";
    req.body.message.attributes.overwrittenByGeneration = "OBJECT_DELETE";

    connector.handleRequest(req, res);

    assert(!rp.post.called);
  });

  it("return failure when it cannot send message to MS", ()=>{
    simple.restore(rp, "post");
    simple.mock(rp, "post").rejectWith(new Error("Cannot connect to MS"))

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, MS_SERVER_ERROR_CODE)
    });
  });

  it("return failure when it is missing eventType", ()=>{
    assert(Reflect.deleteProperty(req.body.message.attributes, "eventType"));

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, CLIENT_ERROR_CODE)
    });
  });

  it("return failure when it is missing attributes", ()=>{
    req = {body: {message: {}}};

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, CLIENT_ERROR_CODE)
    });
  });

  it("return failure when it is missing message", ()=>{
    req = {body: {}};

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, CLIENT_ERROR_CODE)
    });
  });

  it("return failure when it is missing body", ()=>{
    req = {};

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, CLIENT_ERROR_CODE)
    });
  });
});
