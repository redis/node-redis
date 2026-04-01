import assert from "node:assert/strict";
import testUtils, { GLOBAL } from "../test-utils";
import LATENCY_HISTOGRAM from "./LATENCY_HISTOGRAM";
import { parseArgs } from "./generic-transformers";

describe("LATENCY HISTOGRAM", () => {
  describe("transformArguments", () => {
    it("filtered by command set", () => {
      assert.deepEqual(parseArgs(LATENCY_HISTOGRAM, "set"), [
        "LATENCY",
        "HISTOGRAM",
        "set",
      ]);
    });

    it("unfiltered", () => {
      assert.deepEqual(parseArgs(LATENCY_HISTOGRAM), [
        "LATENCY",
        "HISTOGRAM",
      ]);
    });
  });

  describe("RESP 2", () => {
    testUtils.testWithClient(
      "unfiltered list",
      async (client) => {
        await client.configResetStat();
        await Promise.all([
          client.lPush("push-key", "hello "),
          client.set("set-key", "world!"),
        ]);
        const histogram = await client.latencyHistogram();
        const commands = ["config|resetstat", "set", "lpush"];
        for (const command of commands) {
          assert.ok(typeof histogram[command]["calls"], "number");
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClient(
      "filtered by a command list",
      async (client) => {
        await client.configSet("latency-monitor-threshold", "100");
        await client.set("set-key", "hello");
        const histogram = await client.latencyHistogram("set");
        assert.ok(typeof histogram.set["calls"], "number");
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClient(
      "structural validation of response shape",
      async (client) => {
        await client.configResetStat();
        await client.set("test-key", "test-value");
        const histogram = await client.latencyHistogram("set");

        // Assert the response is a plain object (RESP2), not a Map (RESP3)
        assert.equal(typeof histogram, "object");
        assert.ok(histogram !== null);
        assert.ok(!Array.isArray(histogram));
        assert.ok(!(histogram instanceof Map));

        // Assert the structure of each command entry
        assert.ok("set" in histogram);
        assert.equal(typeof histogram.set, "object");
        assert.equal(typeof histogram.set.calls, "number");
        assert.ok(histogram.set.calls > 0);
        assert.equal(typeof histogram.set.histogram_usec, "object");
        assert.ok(histogram.set.histogram_usec !== null);
        assert.ok(!Array.isArray(histogram.set.histogram_usec));
        assert.ok(!(histogram.set.histogram_usec instanceof Map));
      },
      GLOBAL.SERVERS.OPEN,
    );
  });

  describe("RESP 3", () => {
    testUtils.testWithClient(
      "unfiltered list",
      async (client) => {
        await client.configResetStat();
        await Promise.all([
          client.lPush("push-key", "hello "),
          client.set("set-key", "world!"),
        ]);
        const histogram = await client.latencyHistogram();
        const commands = ["config|resetstat", "set", "lpush"];
        for (const command of commands) {
          assert.ok(typeof histogram[command]["calls"], "number");
        }
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: {
          RESP: 3,
        },
      },
    );

    testUtils.testWithClient(
      "filtered by a command list",
      async (client) => {
        await client.configSet("latency-monitor-threshold", "100");
        await client.set("set-key", "hello");
        const histogram = await client.latencyHistogram("set");
        assert.ok(typeof histogram.set["calls"], "number");
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: {
          RESP: 3,
        },
      },
    );
  });
});