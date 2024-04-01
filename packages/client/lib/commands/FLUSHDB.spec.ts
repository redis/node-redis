import { strict as assert } from "assert";
import testUtils, { GLOBAL } from "../test-utils";
import { ValkeyFlushModes } from "./FLUSHALL";
import { transformArguments } from "./FLUSHDB";

describe("FLUSHDB", () => {
  describe("transformArguments", () => {
    it("default", () => {
      assert.deepEqual(transformArguments(), ["FLUSHDB"]);
    });

    it("ASYNC", () => {
      assert.deepEqual(transformArguments(ValkeyFlushModes.ASYNC), [
        "FLUSHDB",
        "ASYNC",
      ]);
    });

    it("SYNC", () => {
      assert.deepEqual(transformArguments(ValkeyFlushModes.SYNC), [
        "FLUSHDB",
        "SYNC",
      ]);
    });
  });

  testUtils.testWithClient(
    "client.flushDb",
    async (client) => {
      assert.equal(await client.flushDb(), "OK");
    },
    GLOBAL.SERVERS.OPEN
  );
});
