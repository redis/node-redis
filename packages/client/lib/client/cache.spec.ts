import assert from "assert";
import { generateCacheKey } from "./cache";
import { RedisArgument } from '../RESP/types';
import testUtils, { GLOBAL } from "../test-utils"
import { BasicClientSideCache, BasicPooledClientSideCache } from "./cache"
import { REDIS_FLUSH_MODES } from "../commands/FLUSHALL";
import { once } from 'events';
import fc from 'fast-check';

describe("Client Side Cache", () => {
  describe('Basic Cache', () => {
    const csc = new BasicClientSideCache({ maxEntries: 10 });

    /* cacheNotEmpty */
    testUtils.testWithClient('Basic Cache Miss', async client => {
      csc.clear();

      await client.set("x", 1);
      await client.get("x");

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    /* cacheUsedTest */
    testUtils.testWithClient('Basic Cache Hit', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 1, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('Max Cache Entries', async client => {
      csc.clear();

      await client.set('1', 1);
      assert.equal(await client.get('1'), '1');
      assert.equal(await client.get('2'), null);
      assert.equal(await client.get('3'), null);
      assert.equal(await client.get('4'), null);
      assert.equal(await client.get('5'), null);
      assert.equal(await client.get('6'), null);
      assert.equal(await client.get('7'), null);
      assert.equal(await client.get('8'), null);
      assert.equal(await client.get('9'), null);
      assert.equal(await client.get('10'), null);
      assert.equal(await client.get('11'), null);
      assert.equal(await client.get('1'), '1');

      assert.equal(csc.cacheMisses(), 12, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('LRU works correctly', async client => {
      csc.clear();

      await client.set('1', 1);
      assert.equal(await client.get('1'), '1');
      assert.equal(await client.get('2'), null);
      assert.equal(await client.get('3'), null);
      assert.equal(await client.get('4'), null);
      assert.equal(await client.get('5'), null);
      assert.equal(await client.get('1'), '1');
      assert.equal(await client.get('6'), null);
      assert.equal(await client.get('7'), null);
      assert.equal(await client.get('8'), null);
      assert.equal(await client.get('9'), null);
      assert.equal(await client.get('10'), null);
      assert.equal(await client.get('11'), null);
      assert.equal(await client.get('1'), '1');

      assert.equal(csc.cacheMisses(), 11, "Cache Misses");
      assert.equal(csc.cacheHits(), 2, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('Basic Cache Clear', async client => {
      csc.clear();

      await client.set("x", 1);
      await client.get("x");
      csc.clear();
      await client.get("x");

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('Null Invalidate acts as clear', async client => {
      csc.clear();

      await client.set("x", 1);
      await client.get("x");
      csc.invalidate(null);
      await client.get("x");

      assert.equal(2, csc.cacheMisses(), "Cache Misses");
      assert.equal(0, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('flushdb causes an invalidate null', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      await client.flushDb(REDIS_FLUSH_MODES.SYNC);
      assert.equal(await client.get("x"), null);

      assert.equal(csc.cacheMisses(), 2, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('Basic Cache Invalidate', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1', 'first get');
      await client.set("x", 2);
      assert.equal(await client.get("x"), '2', 'second get');
      await client.set("x", 3);
      assert.equal(await client.get("x"), '3', 'third get');

      assert.equal(csc.cacheMisses(), 3, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    /* immutableCacheEntriesTest */
    testUtils.testWithClient("Cached Replies Don't Mutate", async client => {
      csc.clear();

      await client.set("x", 1);
      await client.set('y', 2);
      const ret1 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret1, ['1', '2'], 'first mGet');
      ret1[0] = '4';
      const ret2 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret2, ['1', '2'], 'second mGet');
      ret2[0] = '8';
      const ret3 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret3, ['1', '2'], 'third mGet');

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 2, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    /* clearOnDisconnectTest */
    testUtils.testWithClient("Cached cleared on disconnect", async client => {
      csc.clear();

      await client.set("x", 1);
      await client.set('y', 2);
      const ret1 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret1, ['1', '2'], 'first mGet');

      assert.equal(csc.cacheMisses(), 1, "first Cache Misses");
      assert.equal(csc.cacheHits(), 0, "first Cache Hits");

      await client.close();

      await client.connect();

      const ret2 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret2, ['1', '2'], 'second mGet');

      assert.equal(csc.cacheMisses(), 1, "second Cache Misses");
      assert.equal(csc.cacheHits(), 0, "second Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });
  });

  describe("Pooled Cache", () => {
    const csc = new BasicPooledClientSideCache();

    testUtils.testWithClient('Virtual Pool Disconnect', async client1 => {
      const client2 = client1.duplicate();
      await client2.connect()

      assert.equal(await client2.get("x"), null);
      assert.equal(await client1.get("x"), null);

      assert.equal(1, csc.cacheMisses(), "Cache Misses");
      assert.equal(1, csc.cacheHits(), "Cache Hits");

      await client2.close();

      assert.equal(await client1.get("x"), null);
      assert.equal(await client1.get("x"), null);

      assert.equal(2, csc.cacheMisses(), "Cache Misses");
      assert.equal(2, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    /* cacheNotEmpty */
    testUtils.testWithClientPool('Basic Cache Miss and Clear', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');

      assert.equal(1, csc.cacheMisses(), "Cache Misses");
      assert.equal(0, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
      },
      poolOptions: {
        minimum: 5,
        maximum: 5,
        acquireTimeout: 0,
        cleanupDelay: 1,
        clientSideCache: csc
      }
    })

    /* cacheUsedTest */
    testUtils.testWithClientPool('Basic Cache Hit', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 2, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
      },
      poolOptions: {
        minimum: 5,
        maximum: 5,
        acquireTimeout: 0,
        cleanupDelay: 1,
        clientSideCache: csc
      }
    })

    /* invalidationTest 1 */
    testUtils.testWithClientPool('Basic Cache Manually Invalidate', async client => {
      csc.clear();

      await client.set("x", 1);

      assert.equal(await client.get("x"), '1', 'first get');

      let p: Promise<Array<string>> = once(csc, 'invalidate');
      await client.set("x", 2);
      let [i] = await p;

      assert.equal(await client.get("x"), '2', 'second get');

      p = once(csc, 'invalidate');
      await client.set("x", 3);
      [i] = await p;

      assert.equal(await client.get("x"), '3');

      assert.equal(csc.cacheMisses(), 3, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
      },
      poolOptions: {
        minimum: 5,
        maximum: 5,
        acquireTimeout: 0,
        cleanupDelay: 1,
        clientSideCache: csc
      }
    })

    /* invalidationTest 2 */
    testUtils.testWithClientPool('Basic Cache Invalidate via message', async client => {
      csc.clear();

      await client.set('x', 1);
      await client.set('y', 2);

      assert.deepEqual(await client.mGet(['x', 'y']), ['1', '2'], 'first mGet');

      assert.equal(csc.cacheMisses(), 1, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");

      let p: Promise<Array<string>> = once(csc, 'invalidate');
      await client.set("x", 3);
      let [i] = await p;

      assert.equal(i, 'x');

      assert.deepEqual(await client.mGet(['x', 'y']), ['3', '2'], 'second mGet');

      assert.equal(csc.cacheMisses(), 2, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");

      p = once(csc, 'invalidate');
      await client.set("y", 4);
      [i] = await p;

      assert.equal(i, 'y');

      assert.deepEqual(await client.mGet(['x', 'y']), ['3', '4'], 'second mGet');

      assert.equal(csc.cacheMisses(), 3, "Cache Misses");
      assert.equal(csc.cacheHits(), 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
      },
      poolOptions: {
        minimum: 5,
        maximum: 5,
        acquireTimeout: 0,
        cleanupDelay: 1,
        clientSideCache: csc
      }
    })
  });

  describe('Cluster Caching', () => {
    const csc = new BasicPooledClientSideCache();

    testUtils.testWithCluster('Basic Cache Miss and Clear', async client => {
      csc.clear();

      await client.set("x", 1);
      await client.get("x");
      await client.set("y", 1);
      await client.get("y");

      assert.equal(2, csc.cacheMisses(), "Cache Misses");
      assert.equal(0, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        RESP: 3,
        clientSideCache: csc
      }
    })

    testUtils.testWithCluster('Basic Cache Hit', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');
      await client.set("y", 1);
      assert.equal(await client.get("y"), '1');
      assert.equal(await client.get("y"), '1');
      assert.equal(await client.get("y"), '1');

      assert.equal(2, csc.cacheMisses(), "Cache Misses");
      assert.equal(4, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        RESP: 3,
        clientSideCache: csc
      }
    })

    testUtils.testWithCluster('Basic Cache Invalidate', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      await client.set("x", 2);
      assert.equal(await client.get("x"), '2');
      await client.set("x", 3);
      assert.equal(await client.get("x"), '3');

      await client.set("y", 1);
      assert.equal(await client.get("y"), '1');
      await client.set("y", 2);
      assert.equal(await client.get("y"), '2');
      await client.set("y", 3);
      assert.equal(await client.get("y"), '3');

      assert.equal(6, csc.cacheMisses(), "Cache Misses");
      assert.equal(0, csc.cacheHits(), "Cache Hits");
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        RESP: 3,
        clientSideCache: csc
      }
    })
  });
});
describe("generateCacheKey property based tests", () => {
  // We'll use a mix of ASCII and Unicode strings for thorough testing
  const argumentArb = fc.oneof(
    fc.string({ minLength: 0, maxLength: 20, unit: 'grapheme-ascii' }), // ASCII strings
    fc.string({ minLength: 0, maxLength: 20, unit: 'grapheme' }) // Unicode strings with proper graphemes
  );
  const argumentsArb = fc.array(argumentArb, { minLength: 1, maxLength: 10 });

  it("should generate deterministic keys", () => {
    fc.assert(
      fc.property(argumentsArb, (args) => {
        const key1 = generateCacheKey(args);
        const key2 = generateCacheKey([...args]); // Create a copy
        return key1 === key2;
      })
    );
  });

  it("should generate different keys for different commands", () => {
    fc.assert(
      fc.property(
        argumentsArb,
        argumentArb,
        (args, differentArg) => {
          fc.pre(args.length > 0 && !args.includes(differentArg));

          // Create a modified copy with one different argument
          const modifiedArgs = [...args];
          const randomIndex = Math.floor(Math.random() * args.length);
          modifiedArgs[randomIndex] = differentArg;

          const key1 = generateCacheKey(args);
          const key2 = generateCacheKey(modifiedArgs);

          return key1 !== key2;
        }
      )
    );
  });

  it("should be sensitive to argument order", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, unit: 'grapheme' }),
          fc.string({ minLength: 1, unit: 'grapheme' })
        ).filter(([a, b]) => a !== b),
        ([str1, str2]) => {
          const args1 = [str1, str2];
          const args2 = [str2, str1];

          const key1 = generateCacheKey(args1);
          const key2 = generateCacheKey(args2);

          return key1 !== key2;
        }
      )
    );
  });;

  it("should produce no collisions across different argument patterns", () => {
    // This test tries to find a collision by generating many random argument sets
    const cacheKeyMap = new Map<string, RedisArgument[]>();

    fc.assert(
      fc.property(argumentsArb, (args) => {
        const key = generateCacheKey(args);

        if (cacheKeyMap.has(key)) {
          const existingArgs = cacheKeyMap.get(key)!;
          // Check if this is actually the same arguments
          const argsEqual = args.length === existingArgs.length &&
            args.every((arg, i) => arg === existingArgs[i]);

          // If args are different but key is the same, we found a collision
          if (!argsEqual) {
            return false; // This will fail the test
          }
        } else {
          cacheKeyMap.set(key, [...args]);
        }

        return true;
      }),
      {
        numRuns: 1000,
        examples: [
          [["1", "22"]], // "1" has length 1, "22" has length 2
          [["12", "2"]], // "12" has length 2, "2" has length 1
          [["12_3", "1"]], // Edge case with underscore in string
          [["1_2", "123"]], // Another underscore test case
          [["_", "__"]], // Just underscores of different lengths
          [["1", "1_"]], // String and string with underscore suffix
          [["1__", "111"]], // Multiple underscores vs repeated digit

        ]
      }
    );
  });

  describe("generateCacheKey 'hash' function ", () => {
    const argumentArb = fc.oneof(
      fc.string({ unit: 'grapheme-ascii' }),              // string ascii values
      fc.string({ unit: 'grapheme' }),// string unicode values
      fc.integer().map(String), // numeric values as strings
      fc.constant(""),
      fc.constant("_")
    );
    const argumentsArb = fc.array(argumentArb, { minLength: 1, maxLength: 10 });

    it("should generate keys according to its specification", () => {
      fc.assert(
        fc.property(argumentsArb, (args) => {
          const generatedKey = generateCacheKey(args);

          const tmp = new Array(args.length * 2);
          for (let i = 0; i < args.length; i++) {
            tmp[i] = String(args[i]).length;        // Lengths first
            tmp[i + args.length] = String(args[i]); // Then values
          }
          const expectedKey = tmp.join('_');

          // Verify the generated key matches our expected key
          return generatedKey === expectedKey;
        }),
        {
          numRuns: 1000,  // Run more tests for better coverage
          examples: [
            [[""]],        // Single empty string
            [["0"]],       // String that looks like a number
            [["_"]],       // String with just an underscore
            [["_", ""]],   // Underscore and empty string
            [["a_b"]],     // String containing an underscore
            [["a", "b"]],  // Multiple normal strings
            [["", "", ""]], // Multiple empty strings
            [["1", "22"]], // "1" has length 1, "22" has length 2
            [["12", "2"]], // "12" has length 2, "2" has length 1
            [["12_3", "1"]], // Edge case with underscore in string
            [["1_2", "123"]], // Another underscore test case
            [["_", "__"]], // Just underscores of different lengths
            [["1", "1_"]], // String and string with underscore suffix
            [["1__", "111"]], // Multiple underscores vs repeated digit
          ]
        }
      );
    });
  });
});
