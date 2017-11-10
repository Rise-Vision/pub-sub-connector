/* eslint-env mocha */
/* eslint max-statements: ["error", 10, { "ignoreTopLevelFunctions": true }] */
const assert = require("assert");
const simple = require("simple-mock");
const connector = require("../../src/connector");
const rp = require('request-promise-native');
const CLIENT_ERROR_CODE = 400;
const MS_SERVER_ERROR_CODE = 502;
const SUCCESS_CODE = 200;
const TIMEOUT = 100;
let res = {};

describe("Connector", ()=>{

  beforeEach(()=>{
    res = {sendStatus: ()=>{}};
    simple.mock(res, "sendStatus").returnWith(true);
  });

  afterEach(()=>{
    simple.restore()
  });

  it("return success when it can send message to MS", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, eventType: "OBJECT_FINALIZE"}}}};
    simple.mock(rp, "post").resolveWith()

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], SUCCESS_CODE)
    }, TIMEOUT);

  });

  it("send message with objectId, bucketId, objectGeneration and ADD type", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, eventType: "OBJECT_FINALIZE"}}}};
    simple.mock(rp, "post").resolveWith()

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.deepEqual(rp.post.lastCall.args[0].body, {
              "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
              "version": `${req.body.message.attributes.objectGeneration}`,
              "type": "ADD"
             })
    }, TIMEOUT);
  });

  it("send message with objectId, bucketId, objectGeneration and DELETE type", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, eventType: "OBJECT_DELETE"}}}};
    simple.mock(rp, "post").resolveWith()

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.deepEqual(rp.post.lastCall.args[0].body, {
              "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
              "version": `${req.body.message.attributes.objectGeneration}`,
              "type": "DELETE"
             })
    }, TIMEOUT);
  });

  it("send message with objectId, bucketId, objectGeneration and UPDATE type", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, overwroteGeneration: 1111, eventType: "OBJECT_FINALIZE"}}}};
    simple.mock(rp, "post").resolveWith()

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.deepEqual(rp.post.lastCall.args[0].body, {
              "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
              "version": `${req.body.message.attributes.objectGeneration}`,
              "type": "DELETE"
             })
    }, TIMEOUT);
  });

  it("skip sending message when there are a event type OBJECT_DELETE and a overwrittenByGeneration attribute", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, overwrittenByGeneration: 1111, eventType: "OBJECT_DELETE"}}}};
    simple.mock(rp, "post").resolveWith()

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert(!rp.post.called)
    }, TIMEOUT);
  });

  it("return failure when it cannot send message to MS", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, eventType: "OBJECT_FINALIZE"}}}};
    simple.mock(rp, "post").rejectWith(new Error("Cannot connect to MS"))

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], MS_SERVER_ERROR_CODE)
    }, TIMEOUT);

  });

  it("return failure when it is missing eventType", ()=>{

    const req = {body: {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111}}}};

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], CLIENT_ERROR_CODE)
    }, TIMEOUT);

  });

  it("return failure when it is missing attributes", ()=>{

    const req = {body: {message: {}}};

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], CLIENT_ERROR_CODE)
    }, TIMEOUT);

  });

  it("return failure when it is missing message", ()=>{

    const req = {body: {}};

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], CLIENT_ERROR_CODE)
    }, TIMEOUT);

  });

  it("return failure when it is missing body", ()=>{

    const req = {};

    connector.handleRequest(req, res);

    setTimeout(()=>{
      assert.equal(res.sendStatus.lastCall.args[0], CLIENT_ERROR_CODE)
    }, TIMEOUT);

  });
});
