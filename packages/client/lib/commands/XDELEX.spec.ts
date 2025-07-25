import { strict as assert } from "node:assert";
import XDELEX from "./XDELEX";
import { parseArgs } from "./generic-transformers";
import testUtils, { GLOBAL } from "../test-utils";
import {
  STREAM_DELETION_POLICY,
  STREAM_DELETION_REPLY_CODES,
} from "./common-stream.types";

describe("XDELEX", () => {
  describe("transformArguments", () => {
    it("string - without policy", () => {
      assert.deepEqual(parseArgs(XDELEX, "key", "0-0"), [
        "XDELEX",
        "key",
        "IDS",
        "1",
        "0-0",
      ]);
    });

    it("string - with policy", () => {
      assert.deepEqual(
        parseArgs(XDELEX, "key", "0-0", STREAM_DELETION_POLICY.KEEPREF),
        ["XDELEX", "key", "KEEPREF", "IDS", "1", "0-0"]
      );
    });

    it("array - without policy", () => {
      assert.deepEqual(parseArgs(XDELEX, "key", ["0-0", "1-0"]), [
        "XDELEX",
        "key",
        "IDS",
        "2",
        "0-0",
        "1-0",
      ]);
    });

    it("array - with policy", () => {
      assert.deepEqual(
        parseArgs(XDELEX, "key", ["0-0", "1-0"], STREAM_DELETION_POLICY.DELREF),
        ["XDELEX", "key", "DELREF", "IDS", "2", "0-0", "1-0"]
      );
    });
  });

  testUtils.testAll(
    `XDELEX non-existing key - without policy`,
    async (client) => {
      const reply = await client.xDelEx("{tag}stream-key", "0-0");
      assert.deepEqual(reply, [STREAM_DELETION_REPLY_CODES.NOT_FOUND]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XDELEX existing key - without policy`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const messageId = await client.xAdd(streamKey, "*", {
        field: "value",
      });

      const reply = await client.xDelEx(
        streamKey,
        messageId,
      );
      assert.deepEqual(reply, [STREAM_DELETION_REPLY_CODES.DELETED]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XDELEX existing key - with policy`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const messageId = await client.xAdd(streamKey, "*", {
        field: "value",
      });

      const reply = await client.xDelEx(
        streamKey,
        messageId,
        STREAM_DELETION_POLICY.DELREF
      );
      assert.deepEqual(reply, [STREAM_DELETION_REPLY_CODES.DELETED]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XDELEX acknowledge policy - with consumer group`,
    async (client) => {
      const streamKey = "{tag}stream-key";

      // Add a message to the stream
      const messageId = await client.xAdd(streamKey, "*", {
        field: "value",
      });

      // Create consumer group
      await client.xGroupCreate(streamKey, "testgroup", "0");

      const reply = await client.xDelEx(
        streamKey,
        messageId,
        STREAM_DELETION_POLICY.ACKED
      );
      assert.deepEqual(reply, [STREAM_DELETION_REPLY_CODES.DANGLING_REFS]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    `XDELEX multiple keys`,
    async (client) => {
      const streamKey = "{tag}stream-key";
      const messageIds = await Promise.all([
        client.xAdd(streamKey, "*", {
          field: "value1",
        }),
        client.xAdd(streamKey, "*", {
          field: "value2",
        }),
      ]);

      const reply = await client.xDelEx(
        streamKey,
        [...messageIds, "0-0"],
        STREAM_DELETION_POLICY.DELREF
      );
      assert.deepEqual(reply, [
        STREAM_DELETION_REPLY_CODES.DELETED,
        STREAM_DELETION_REPLY_CODES.DELETED,
        STREAM_DELETION_REPLY_CODES.NOT_FOUND,
      ]);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );
});
