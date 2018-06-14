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
    });
  });

  it("send DELETE message when file is trashed", () => {
    req.body = {
      "message": {
        "data": "ewogICJraW5kIjogInN0b3JhZ2Ujb2JqZWN0IiwKICAiaWQiOiAicmlzZW1lZGlhbGlicmFyeS1hYzU3ZGVmMi04MzRlLTRlY2QtOGI5MS00NGNhMTQ1MjRmZDAvdGVzdDEvMTUyOTAwMTI1NjM2OTU5OCIsCiAgInNlbGZMaW5rIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3N0b3JhZ2UvdjEvYi9yaXNlbWVkaWFsaWJyYXJ5LWFjNTdkZWYyLTgzNGUtNGVjZC04YjkxLTQ0Y2ExNDUyNGZkMC9vL3Rlc3QxIiwKICAibmFtZSI6ICJ0ZXN0MSIsCiAgImJ1Y2tldCI6ICJyaXNlbWVkaWFsaWJyYXJ5LWFjNTdkZWYyLTgzNGUtNGVjZC04YjkxLTQ0Y2ExNDUyNGZkMCIsCiAgImdlbmVyYXRpb24iOiAiMTUyOTAwMTI1NjM2OTU5OCIsCiAgIm1ldGFnZW5lcmF0aW9uIjogIjMiLAogICJ0aW1lQ3JlYXRlZCI6ICIyMDE4LTA2LTE0VDE4OjM0OjE2LjM2OVoiLAogICJ1cGRhdGVkIjogIjIwMTgtMDYtMTRUMTg6MzQ6MjEuMzI5WiIsCiAgInN0b3JhZ2VDbGFzcyI6ICJTVEFOREFSRCIsCiAgInRpbWVTdG9yYWdlQ2xhc3NVcGRhdGVkIjogIjIwMTgtMDYtMTRUMTg6MzQ6MTYuMzY5WiIsCiAgInNpemUiOiAiOSIsCiAgIm1kNUhhc2giOiAiNjNNNkFNREowemJtVnBHamVyVkNrdz09IiwKICAibWVkaWFMaW5rIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Rvd25sb2FkL3N0b3JhZ2UvdjEvYi9yaXNlbWVkaWFsaWJyYXJ5LWFjNTdkZWYyLTgzNGUtNGVjZC04YjkxLTQ0Y2ExNDUyNGZkMC9vL3Rlc3QxP2dlbmVyYXRpb249MTUyOTAwMTI1NjM2OTU5OCZhbHQ9bWVkaWEiLAogICJjYWNoZUNvbnRyb2wiOiAiQ2FjaGUtQ29udHJvbDpwdWJsaWMsIG1heC1hZ2U9ODY0MDAiLAogICJtZXRhZGF0YSI6IHsKICAgICJ0cmFzaGVkIjogInRydWUiCiAgfSwKICAiY3JjMzJjIjogIk0zbTB5Zz09IiwKICAiZXRhZyI6ICJDTDc3L01YbDA5c0NFQU09Igp9Cg==",
        "attributes": {
          "objectGeneration": "1529001256369598",
          "eventTime": "2018-06-14T18:34:21.329971Z",
          "eventType": "OBJECT_METADATA_UPDATE",
          "payloadFormat": "JSON_API_V1",
          "notificationConfig": "projects/_/buckets/risemedialibrary-ac57def2-834e-4ecd-8b91-44ca14524fd0/notificationConfigs/2",
          "bucketId": "risemedialibrary-ac57def2-834e-4ecd-8b91-44ca14524fd0",
          "objectId": "test1"
        },
        "message_id": "118585474886991",
        "messageId": "118585474886991",
        "publish_time": "2018-06-14T18:34:21.452Z",
        "publishTime": "2018-06-14T18:34:21.452Z"
      },
      "subscription": "projects/messaging-service-180514/subscriptions/pubsubconnector"
    };

    connector.handleRequest(req, res);

    assert.deepEqual(rp.post.lastCall.args[0].body, {
      "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
      "version": `${req.body.message.attributes.objectGeneration}`,
      "type": "DELETE"
    });
  });

  it("send ADD message when file is restored", () => {
    req.body = {
      "message": {
        "data": "ewogICJraW5kIjogInN0b3JhZ2Ujb2JqZWN0IiwKICAiaWQiOiAicmlzZW1lZGlhbGlicmFyeS03ZDk0OGFjNy1kZWNjLTRlZDMtYWE5Yy05YmE0M2JkYTkxZGMvdGltb3RoeS1lYmVybHktNTE1ODAxLXVuc3BsYXNoLmpwZy8xNTI4OTk3OTQyNzQ0MzUxIiwKICAic2VsZkxpbmsiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vc3RvcmFnZS92MS9iL3Jpc2VtZWRpYWxpYnJhcnktN2Q5NDhhYzctZGVjYy00ZWQzLWFhOWMtOWJhNDNiZGE5MWRjL28vdGltb3RoeS1lYmVybHktNTE1ODAxLXVuc3BsYXNoLmpwZyIsCiAgIm5hbWUiOiAidGltb3RoeS1lYmVybHktNTE1ODAxLXVuc3BsYXNoLmpwZyIsCiAgImJ1Y2tldCI6ICJyaXNlbWVkaWFsaWJyYXJ5LTdkOTQ4YWM3LWRlY2MtNGVkMy1hYTljLTliYTQzYmRhOTFkYyIsCiAgImdlbmVyYXRpb24iOiAiMTUyODk5Nzk0Mjc0NDM1MSIsCiAgIm1ldGFnZW5lcmF0aW9uIjogIjMiLAogICJjb250ZW50VHlwZSI6ICJpbWFnZS9qcGVnIiwKICAidGltZUNyZWF0ZWQiOiAiMjAxOC0wNi0xNFQxNzozOTowMi43NDNaIiwKICAidXBkYXRlZCI6ICIyMDE4LTA2LTE0VDE3OjM5OjA1LjExNFoiLAogICJzdG9yYWdlQ2xhc3MiOiAiU1RBTkRBUkQiLAogICJ0aW1lU3RvcmFnZUNsYXNzVXBkYXRlZCI6ICIyMDE4LTA2LTE0VDE3OjM5OjAyLjc0M1oiLAogICJzaXplIjogIjE3MjU5NzkiLAogICJtZDVIYXNoIjogIlJqZTZIangwYkVxTFRwVW14ajNqMEE9PSIsCiAgIm1lZGlhTGluayI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9kb3dubG9hZC9zdG9yYWdlL3YxL2IvcmlzZW1lZGlhbGlicmFyeS03ZDk0OGFjNy1kZWNjLTRlZDMtYWE5Yy05YmE0M2JkYTkxZGMvby90aW1vdGh5LWViZXJseS01MTU4MDEtdW5zcGxhc2guanBnP2dlbmVyYXRpb249MTUyODk5Nzk0Mjc0NDM1MSZhbHQ9bWVkaWEiLAogICJjYWNoZUNvbnRyb2wiOiAiQ2FjaGUtQ29udHJvbDpwdWJsaWMsIG1heC1hZ2U9ODY0MDAiLAogICJtZXRhZGF0YSI6IHsKICAgICJ0aHVtYm5haWwiOiAiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL21VSmFtR25wRXBkWmNSaTFBT0ptRVI0blo5WU5TcW5ZcFFjWmk1Y1NjV0RaVHRIX1BNSnRMbWU3MVNpOWYyam5kdEV6Y3F5dkNzb2taWkI4YTljMCIKICB9LAogICJjcmMzMmMiOiAiTXB1RjVRPT0iLAogICJldGFnIjogIkNKK3E5Wm5aMDlzQ0VBTT0iCn0K",
        "attributes": {
          "objectGeneration": "1528997942744351",
          "eventTime": "2018-06-14T17:39:05.114493Z",
          "eventType": "OBJECT_METADATA_UPDATE",
          "payloadFormat": "JSON_API_V1",
          "notificationConfig": "projects/_/buckets/risemedialibrary-7d948ac7-decc-4ed3-aa9c-9ba43bda91dc/notificationConfigs/8",
          "bucketId": "risemedialibrary-7d948ac7-decc-4ed3-aa9c-9ba43bda91dc",
          "objectId": "timothy-eberly-515801-unsplash.jpg"
        },
        "message_id": "119683371845093",
        "messageId": "119683371845093",
        "publish_time": "2018-06-14T17:39:05.255Z",
        "publishTime": "2018-06-14T17:39:05.255Z"
      },
      "subscription": "projects/messaging-service-180514/subscriptions/pubsubconnector"
    };

    connector.handleRequest(req, res);

    assert.deepEqual(rp.post.lastCall.args[0].body, {
      "filePath": `${req.body.message.attributes.bucketId}/${req.body.message.attributes.objectId}`,
      "version": `${req.body.message.attributes.objectGeneration}`,
      "type": "ADD"
    });
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

  it("acknowledges receipt for unexpected event types", ()=>{
    req.body.message.attributes.eventType = "XXXX";

    connector.handleRequest(req, res);

    return resPromise.then(code=>{
      assert.equal(code, SUCCESS_CODE)
    });
  });
});
