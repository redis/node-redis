import { strict as assert } from "node:assert";
import testUtils, { GLOBAL } from "../test-utils";
import MSETEX, { ExpirationMode, SetMode } from "./MSETEX";
import { parseArgs } from "./generic-transformers";

describe("MSETEX", () => {
  describe("transformArguments", () => {
    it("single key-value pair as array", () => {
      assert.deepEqual(parseArgs(MSETEX, ["key1", "value1"]), [
        "MSETEX",
        "1",
        "key1",
        "value1",
      ]);
    });

    it("array of key value pairs", () => {
      assert.deepEqual(
        parseArgs(MSETEX, [
          "key1",
          "value1",
          "key2",
          "value2",
          "key3",
          "value3",
        ]),
        ["MSETEX", "3", "key1", "value1", "key2", "value2", "key3", "value3"]
      );
    });

    it("array of tuples", () => {
      assert.deepEqual(
        parseArgs(MSETEX, [
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
        ["MSETEX", "2", "key1", "value1", "key2", "value2"]
      );
    });

    it("object of key value pairs", () => {
      assert.deepEqual(
        parseArgs(MSETEX, {
          key1: "value1",
          key2: "value2",
        }),
        ["MSETEX", "2", "key1", "value1", "key2", "value2"]
      );
    });

    it("with EX expiration", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          {
            key1: "value1",
            key2: "value2",
          },
          {
            expiration: {
              type: ExpirationMode.EX,
              value: 1,
            },
          }
        ),
        ["MSETEX", "2", "key1", "value1", "key2", "value2", "EX", "1"]
      );
    });

    it("with NX set mode", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          [
            ["key1", "value1"],
            ["key2", "value2"],
          ],
          {
            mode: SetMode.NX,
          }
        ),
        ["MSETEX", "2", "key1", "value1", "key2", "value2", "NX"]
      );
    });

    it("with XX set mode and PX expiration", () => {
      assert.deepEqual(
        parseArgs(MSETEX, ["key1", "value1", "key2", "value2"], {
          mode: SetMode.XX,
          expiration: {
            type: ExpirationMode.PX,
            value: 1,
          },
        }),
        ["MSETEX", "2", "key1", "value1", "key2", "value2", "XX", "PX", "1"]
      );
    });

    it("with EXAT Date expiration", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          {
            key1: "value1",
            key2: "value2",
          },
          {
            expiration: {
              type: ExpirationMode.EXAT,
              value: new Date("2025-10-28T11:23:36.203Z"),
            },
          }
        ),
        [
          "MSETEX",
          "2",
          "key1",
          "value1",
          "key2",
          "value2",
          "EXAT",
          "1761650616",
        ]
      );
    });

    it("with EXAT numeric expiration", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          [
            ["key1", "value1"],
            ["key2", "value2"],
          ],
          {
            expiration: {
              type: ExpirationMode.EXAT,
              value: 1761650616,
            },
          }
        ),
        [
          "MSETEX",
          "2",
          "key1",
          "value1",
          "key2",
          "value2",
          "EXAT",
          "1761650616",
        ]
      );
    });

    it("with PXAT Date expiration", () => {
      assert.deepEqual(
        parseArgs(MSETEX, ["key1", "value1", "key2", "value2"], {
          expiration: {
            type: ExpirationMode.PXAT,
            value: new Date("2025-10-28T11:23:36.203Z"),
          },
        }),
        [
          "MSETEX",
          "2",
          "key1",
          "value1",
          "key2",
          "value2",
          "PXAT",
          "1761650616203",
        ]
      );
    });

    it("with PXAT numeric expiration", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          {
            key1: "value1",
            key2: "value2",
          },
          {
            expiration: {
              type: ExpirationMode.PXAT,
              value: 1761650616203,
            },
          }
        ),
        [
          "MSETEX",
          "2",
          "key1",
          "value1",
          "key2",
          "value2",
          "PXAT",
          "1761650616203",
        ]
      );
    });

    it("with KEEPTTL expiration", () => {
      assert.deepEqual(
        parseArgs(MSETEX, ["key1", "value1", "key2", "value2"], {
          expiration: {
            type: ExpirationMode.KEEPTTL,
          },
        }),
        ["MSETEX", "2", "key1", "value1", "key2", "value2", "KEEPTTL"]
      );
    });

    it("with empty expiration object", () => {
      assert.deepEqual(
        parseArgs(
          MSETEX,
          [
            ["key1", "value1"],
            ["key2", "value2"],
          ],
          {
            expiration: {},
          }
        ),
        ["MSETEX", "2", "key1", "value1", "key2", "value2"]
      );
    });
  });

  testUtils.testAll(
    "basic mSetEx",
    async (client) => {
      assert.equal(
        await client.mSetEx(["{key}1", "value1", "{key}2", "value2"]),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with XX",
    async (client) => {
      const keyValuePairs = {
        "{key}1": "value1",
        "{key}2": "value2",
      };

      const keysDoNotExist = await client.mSetEx(keyValuePairs, {
        mode: SetMode.XX,
      });

      assert.equal(keysDoNotExist, 0);

      await client.mSet(keyValuePairs);

      const keysExist = await client.mSetEx(keyValuePairs, {
        mode: SetMode.XX,
      });

      assert.equal(keysExist, 1);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with NX",
    async (client) => {
      const keyValuePairs = [
        ["{key}1", "value1"],
        ["{key}2", "value2"],
      ] as Array<[string, string]>;

      const firstAttempt = await client.mSetEx(keyValuePairs, {
        mode: SetMode.NX,
      });

      assert.equal(firstAttempt, 1);

      const secondAttempt = await client.mSetEx(keyValuePairs, {
        mode: SetMode.NX,
      });

      assert.equal(secondAttempt, 0);
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with PX expiration",
    async (client) => {
      assert.equal(
        await client.mSetEx(
          [
            ["{key}1", "value1"],
            ["{key}2", "value2"],
          ],
          {
            expiration: {
              type: ExpirationMode.PX,
              value: 500,
            },
          }
        ),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with EXAT expiration",
    async (client) => {
      assert.equal(
        await client.mSetEx(
          [
            ["{key}1", "value1"],
            ["{key}2", "value2"],
          ],
          {
            expiration: {
              type: ExpirationMode.EXAT,
              value: new Date(Date.now() + 10000),
            },
          }
        ),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with KEEPTTL expiration",
    async (client) => {
      assert.equal(
        await client.mSetEx(["{key}1", "value1", "{key}2", "value2"], {
          expiration: {
            type: ExpirationMode.KEEPTTL,
          },
        }),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );

  testUtils.testAll(
    "mSetEx with all options",
    async (client) => {
      assert.equal(
        await client.mSetEx(
          {
            "{key}1": "value1",
            "{key}2": "value2",
          },
          {
            expiration: {
              type: ExpirationMode.PXAT,
              value: Date.now() + 10000,
            },
            mode: SetMode.NX,
          }
        ),
        1
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
    }
  );
});
