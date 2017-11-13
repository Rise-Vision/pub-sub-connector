/* eslint-env mocha */
const assert = require("assert");
const app = require("../../src/app");
const mockMS = require("./mockMS");
const request = require("superagent");
const SUCCESS_CODE = 200;

describe("Connector", ()=>{

  beforeEach(()=>{
    app.start();
  });

  afterEach(()=>{
    app.stop();
    mockMS.stop();
  });

  it("return success when it can send message to MS", (done)=>{

    const messageFromPubSub = {message: {attributes: {objectId: 1111, bucketId: 1111, objectGeneration: 1111, eventType: "OBJECT_FINALIZE"}}};

    const messageFromPubSubConnector = {
            "filePath": "1111/1111",
            "version": "1111",
            "type": "ADD"
           }
    mockMS.start((req, res)=>{
      assert.deepEqual(req.body, messageFromPubSubConnector);
      res.sendStatus(SUCCESS_CODE);
    }, () => {
      request.post("http://localhost:8080/pubsubconnector")
        .send(messageFromPubSub)
        .end((err, res) => {
          if (err) {
            assert(false)
          }
          assert.equal(res.status, SUCCESS_CODE);
          done();
        });
    })
  });
});
