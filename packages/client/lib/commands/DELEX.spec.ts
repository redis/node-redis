import { strict as assert } from "node:assert";
import DELEX, { DelexCondition } from "./DELEX";
import { parseArgs } from "./generic-transformers";
import testUtils, { GLOBAL } from "../test-utils";

describe("DELEX", () => {
  describe("transformArguments", () => {
    it("no condition", () => {
      assert.deepEqual(parseArgs(DELEX, "key"), ["DELEX", "key"]);
    });

    it("with condition", () => {
      assert.deepEqual(
        parseArgs(DELEX, "key", {
          condition: DelexCondition.IFEQ,
          matchValue: "some-value",
        }),
        ["DELEX", "key", "IFEQ", "some-value"]
      );
    });
  });

  testUtils.testAll(
    "non-existing key",
    async (client) => {
      assert.equal(await client.delEx("key{tag}"), 0);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "non-existing key with condition",
    async (client) => {
      assert.equal(
        await client.delEx("key{tag}", {
          condition: DelexCondition.IFDEQ,
          matchValue: "digest",
        }),
        0
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "existing key no condition",
    async (client) => {
      await client.set("key{tag}", "value");
      assert.equal(await client.delEx("key{tag}"), 1);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "existing key and condition",
    async (client) => {
      await client.set("key{tag}", "some-value");
      
      assert.equal(
        await client.delEx("key{tag}", {
          condition: DelexCondition.IFEQ,
          matchValue: "some-value",
        }),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );
});
