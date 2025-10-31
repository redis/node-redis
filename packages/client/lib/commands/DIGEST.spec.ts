import { strict as assert } from "node:assert";
import DIGEST from "./DIGEST";
import { parseArgs } from "./generic-transformers";
import testUtils, { GLOBAL } from "../test-utils";

describe("DIGEST", () => {
  describe("transformArguments", () => {
    it("digest", () => {
      assert.deepEqual(parseArgs(DIGEST, "key"), ["DIGEST", "key"]);
    });
  });

  testUtils.testAll(
    "existing key",
    async (client) => {
      await client.set("key{tag}", "value");
      assert.equal(typeof await client.digest("key{tag}"), "string");
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "non-existing key",
    async (client) => {
      assert.equal(await client.digest("key{tag}"), null);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );
});
