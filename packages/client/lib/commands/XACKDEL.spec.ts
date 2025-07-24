import { strict as assert } from "node:assert";
import XACKDEL, { XACKDEL_REPLY_CODES, XAckDelPolicy } from "./XACKDEL";
import { parseArgs } from "./generic-transformers";
import testUtils, { GLOBAL } from "../test-utils";

describe("XACKDEL", () => {
  describe("transformArguments", () => {
    it("string - without policy", () => {
      assert.deepEqual(parseArgs(XACKDEL, "key", "group", "0-0"), [
        "XACKDEL",
        "key",
        "group",
        "IDS",
        "1",
        "0-0",
      ]);
    });

    it("string - with policy", () => {
      assert.deepEqual(
        parseArgs(XACKDEL, "key", "group", "0-0", XAckDelPolicy.KEEPREF),
        ["XACKDEL", "key", "group", "KEEPREF", "IDS", "1", "0-0"]
      );
    });

    it("array - without policy", () => {
      assert.deepEqual(parseArgs(XACKDEL, "key", "group", ["0-0", "1-0"]), [
        "XACKDEL",
        "key",
        "group",
        "IDS",
        "2",
        "0-0",
        "1-0",
      ]);
    });

    it("array - with policy", () => {
      assert.deepEqual(
        parseArgs(
          XACKDEL,
          "key",
          "group",
          ["0-0", "1-0"],
          XAckDelPolicy.DELREF
        ),
        ["XACKDEL", "key", "group", "DELREF", "IDS", "2", "0-0", "1-0"]
      );
    });
  });

  testUtils.testAll(
    `XACKDEL non-existing key - without policy`,
    async (client) => {
      const reply = await client.xAckDel("{tag}stream-key", "testgroup", "0-0");
      assert.deepEqual(reply, [XACKDEL_REPLY_CODES.NOT_FOUND]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XACKDEL existing key - without policy`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const groupName = "testgroup";

      // create consumer group, stream and message
      await client.xGroupCreate(streamKey, groupName, "0", { MKSTREAM: true });
      const messageId = await client.xAdd(streamKey, "*", { field: "value" });

      // read message
      await client.xReadGroup(groupName, "testconsumer", {
        key: streamKey,
        id: ">",
      });

      const reply = await client.xAckDel(streamKey, groupName, messageId);
      assert.deepEqual(reply, [XACKDEL_REPLY_CODES.ACKNOWLEDGED_AND_DELETED]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XACKDEL existing key - with policy`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const groupName = "testgroup";

      // create consumer group, stream and message
      await client.xGroupCreate(streamKey, groupName, "0", { MKSTREAM: true });
      const messageId = await client.xAdd(streamKey, "*", { field: "value" });

      // read message
      await client.xReadGroup(groupName, "testconsumer", {
        key: streamKey,
        id: ">",
      });

      const reply = await client.xAckDel(
        streamKey,
        groupName,
        messageId,
        XAckDelPolicy.DELREF
      );
      assert.deepEqual(reply, [XACKDEL_REPLY_CODES.ACKNOWLEDGED_AND_DELETED]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XACKDEL acknowledge policy - with consumer group`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const groupName = "testgroup";

      // create consumer groups, stream and message
      await client.xGroupCreate(streamKey, groupName, "0", { MKSTREAM: true });
      await client.xGroupCreate(streamKey, "some-other-group", "0");
      const messageId = await client.xAdd(streamKey, "*", { field: "value" });

      // read message
      await client.xReadGroup(groupName, "testconsumer", {
        key: streamKey,
        id: ">",
      });

      const reply = await client.xAckDel(
        streamKey,
        groupName,
        messageId,
        XAckDelPolicy.ACKED
      );
      assert.deepEqual(reply, [XACKDEL_REPLY_CODES.ACKNOWLEDGED_DANGLING_REFS]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XACKDEL multiple keys`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const groupName = "testgroup";

      // create consumer groups, stream and add messages
      await client.xGroupCreate(streamKey, groupName, "0", { MKSTREAM: true });
      const messageIds = await Promise.all([
        client.xAdd(streamKey, "*", { field: "value1" }),
        client.xAdd(streamKey, "*", { field: "value2" }),
      ]);

      // read messages
      await client.xReadGroup(groupName, "testconsumer", {
        key: streamKey,
        id: ">",
      });

      const reply = await client.xAckDel(
        streamKey,
        groupName,
        [...messageIds, "0-0"],
        XAckDelPolicy.DELREF
      );
      assert.deepEqual(reply, [
        XACKDEL_REPLY_CODES.ACKNOWLEDGED_AND_DELETED,
        XACKDEL_REPLY_CODES.ACKNOWLEDGED_AND_DELETED,
        XACKDEL_REPLY_CODES.NOT_FOUND,
      ]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );
});
