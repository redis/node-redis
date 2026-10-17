import assert from "assert";
import testUtils, { GLOBAL } from "../test-utils"
import { BasicClientSideCache, BasicPooledClientSideCache, CacheStats } from "./cache"
import { REDIS_FLUSH_MODES } from "../commands/FLUSHALL";
import { once } from 'events';
import RedisClient from "./index";
import { BasicCommandParser } from "./parser";
import { ClientSideCacheCommandError, ClientSideCacheMarkError } from "../errors";

describe("Client Side Cache", () => {
  it("destroy() on a never-connected client does not flush a shared pooled cache (#3396)", () => {
    // Cluster/pool/sentinel share one pooled cache across node clients. Disposing
    // a client whose connect failed terminally must not wipe entries the healthy
    // connections are still using (the dead client cached nothing / missed no
    // invalidations). It must also not throw — the owning client still needs to
    // finish its own cleanup (unregister metrics, dispose credentials).
    const cache = new BasicPooledClientSideCache({ maxEntries: 100 });
    const client = RedisClient.create({ RESP: 3, clientSideCache: cache });

    // Seed the shared cache as if a healthy pooled connection had cached a key.
    cache.set("k", cache.createValueEntry(client as never, "v"), ["k"]);
    assert.ok(cache.get("k"));

    // Never connected (socketEpoch 0): idempotent, no throw, cache untouched.
    assert.doesNotThrow(() => client.destroy());
    assert.doesNotThrow(() => client.destroy());
    assert.ok(cache.get("k"), "a never-connected client must not flush the shared cache");
  });

  describe('Basic Cache', () => {
    const csc = new BasicClientSideCache({ maxEntries: 10 });

    testUtils.testWithClient('Basic Cache Miss', async client => {
      csc.clear();

      await client.set("x", 1);
      await client.get("x");

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient('Basic Cache Hit', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 1, "Cache Hits");
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

      assert.equal(csc.stats().missCount, 12, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
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

      assert.equal(csc.stats().missCount, 11, "Cache Misses");
      assert.equal(csc.stats().hitCount, 2, "Cache Hits");
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

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
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

      assert.equal(2, csc.stats().missCount, "Cache Misses");
      assert.equal(0, csc.stats().hitCount, "Cache Hits");
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

      assert.equal(csc.stats().missCount, 2, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
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

      assert.equal(csc.stats().missCount, 3, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

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

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 2, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClient("Cached cleared on disconnect", async client => {
      csc.clear();

      await client.set("x", 1);
      await client.set('y', 2);
      const ret1 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret1, ['1', '2'], 'first mGet');

      assert.equal(csc.stats().missCount, 1, "first Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "first Cache Hits");

      await client.close();

      await client.connect();

      const ret2 = await client.mGet(['x', 'y']);
      assert.deepEqual(ret2, ['1', '2'], 'second mGet');

      assert.equal(csc.stats().missCount, 1, "second Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "second Cache Hits");
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

      assert.equal(1, csc.stats().missCount, "Cache Misses");
      assert.equal(1, csc.stats().hitCount, "Cache Hits");

      await client2.close();

      assert.equal(await client1.get("x"), null);
      assert.equal(await client1.get("x"), null);

      assert.equal(2, csc.stats().missCount, "Cache Misses");
      assert.equal(2, csc.stats().hitCount, "Cache Hits");
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });

    testUtils.testWithClientPool('Basic Cache Miss and Clear', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');

      assert.equal(1, csc.stats().missCount, "Cache Misses");
      assert.equal(0, csc.stats().hitCount, "Cache Hits");
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

    testUtils.testWithClientPool('Basic Cache Hit', async client => {
      csc.clear();

      await client.set("x", 1);
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');
      assert.equal(await client.get("x"), '1');

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 2, "Cache Hits");
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

    testUtils.testWithClientPool('Basic Cache Manually Invalidate', async client => {
      csc.clear();

      await client.set("x", 1);

      assert.equal(await client.get("x"), '1', 'first get');

      let p: Promise<Array<string>> = once(csc, 'invalidate');
      await client.set("x", 2);
      await p;

      assert.equal(await client.get("x"), '2', 'second get');

      p = once(csc, 'invalidate');
      await client.set("x", 3);
      await p;

      assert.equal(await client.get("x"), '3');

      assert.equal(csc.stats().missCount, 3, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
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

    testUtils.testWithClientPool('Basic Cache Invalidate via message', async client => {
      csc.clear();

      await client.set('x', 1);
      await client.set('y', 2);

      assert.deepEqual(await client.mGet(['x', 'y']), ['1', '2'], 'first mGet');

      assert.equal(csc.stats().missCount, 1, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");

      let p: Promise<Array<string>> = once(csc, 'invalidate');
      await client.set("x", 3);
      let [i] = await p;

      assert.equal(i, 'x');

      assert.deepEqual(await client.mGet(['x', 'y']), ['3', '2'], 'second mGet');

      assert.equal(csc.stats().missCount, 2, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");

      p = once(csc, 'invalidate');
      await client.set("y", 4);
      [i] = await p;

      assert.equal(i, 'y');

      assert.deepEqual(await client.mGet(['x', 'y']), ['3', '4'], 'second mGet');

      assert.equal(csc.stats().missCount, 3, "Cache Misses");
      assert.equal(csc.stats().hitCount, 0, "Cache Hits");
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

      assert.equal(2, csc.stats().missCount, "Cache Misses");
      assert.equal(0, csc.stats().hitCount, "Cache Hits");
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

      assert.equal(2, csc.stats().missCount, "Cache Misses");
      assert.equal(4, csc.stats().hitCount, "Cache Hits");
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

      assert.equal(6, csc.stats().missCount, "Cache Misses");
      assert.equal(0, csc.stats().hitCount, "Cache Hits");
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        RESP: 3,
        clientSideCache: csc
      }
    })
  });
  describe("CacheStats", () => {
    describe("CacheStats.of()", () => {
      it("should correctly initialize stats and calculate derived values", () => {
        const stats = CacheStats.of(10, 5, 8, 2, 100, 3);
        assert.strictEqual(stats.hitCount, 10, "hitCount should be 10");
        assert.strictEqual(stats.missCount, 5, "missCount should be 5");
        assert.strictEqual(stats.loadSuccessCount, 8, "loadSuccessCount should be 8");
        assert.strictEqual(stats.loadFailureCount, 2, "loadFailureCount should be 2");
        assert.strictEqual(stats.totalLoadTime, 100, "totalLoadTime should be 100");
        assert.strictEqual(stats.evictionCount, 3, "evictionCount should be 3");

        assert.strictEqual(stats.requestCount(), 15, "requestCount should be 15 (10 hits + 5 misses)");
        assert.strictEqual(stats.hitRate(), 10 / 15, "hitRate should be 10/15");
        assert.strictEqual(stats.missRate(), 5 / 15, "missRate should be 5/15");
        assert.strictEqual(stats.loadCount(), 10, "loadCount should be 10 (8 success + 2 failure)");
        assert.strictEqual(stats.loadFailureRate(), 2 / 10, "loadFailureRate should be 2/10");
        assert.strictEqual(stats.averageLoadPenalty(), 100 / 10, "averageLoadPenalty should be 10 (100 time / 10 loads)");
      });

      it("should handle zero values and division by zero for derived values", () => {
        const stats = CacheStats.of(0, 0, 0, 0, 0, 0);
        assert.strictEqual(stats.hitCount, 0, "hitCount");
        assert.strictEqual(stats.missCount, 0, "missCount");
        assert.strictEqual(stats.loadSuccessCount, 0, "loadSuccessCount");
        assert.strictEqual(stats.loadFailureCount, 0, "loadFailureCount");
        assert.strictEqual(stats.totalLoadTime, 0, "totalLoadTime");
        assert.strictEqual(stats.evictionCount, 0, "evictionCount");

        assert.strictEqual(stats.requestCount(), 0, "requestCount should be 0");
        assert.strictEqual(stats.hitRate(), 1, "hitRate should be 1 for 0 requests");
        assert.strictEqual(stats.missRate(), 0, "missRate should be 0 for 0 requests");
        assert.strictEqual(stats.loadCount(), 0, "loadCount should be 0");
        assert.strictEqual(stats.loadFailureRate(), 0, "loadFailureRate should be 0 for 0 loads");
        assert.strictEqual(stats.averageLoadPenalty(), 0, "averageLoadPenalty should be 0 for 0 loads");
      });
    });

    describe("CacheStats.empty()", () => {
      it("should return stats with all zero counts and 0 for rates/penalties", () => {
        const stats = CacheStats.empty();
        assert.strictEqual(stats.hitCount, 0, "empty.hitCount");
        assert.strictEqual(stats.missCount, 0, "empty.missCount");
        assert.strictEqual(stats.loadSuccessCount, 0, "empty.loadSuccessCount");
        assert.strictEqual(stats.loadFailureCount, 0, "empty.loadFailureCount");
        assert.strictEqual(stats.totalLoadTime, 0, "empty.totalLoadTime");
        assert.strictEqual(stats.evictionCount, 0, "empty.evictionCount");

        assert.strictEqual(stats.requestCount(), 0, "empty.requestCount");
        assert.strictEqual(stats.hitRate(), 1, "empty.hitRate should be 1");
        assert.strictEqual(stats.missRate(), 0, "empty.missRate should be 0");
        assert.strictEqual(stats.loadCount(), 0, "empty.loadCount");
        assert.strictEqual(stats.loadFailureRate(), 0, "empty.loadFailureRate should be 0");
        assert.strictEqual(stats.averageLoadPenalty(), 0, "empty.averageLoadPenalty should be 0");
      });
    });

    describe("instance methods", () => {
      const stats1 = CacheStats.of(10, 5, 8, 2, 100, 3);
      const stats2 = CacheStats.of(20, 10, 12, 3, 200, 5);

      describe("plus()", () => {
        it("should correctly add two CacheStats instances", () => {
          const sum = stats1.plus(stats2);
          assert.strictEqual(sum.hitCount, 30);
          assert.strictEqual(sum.missCount, 15);
          assert.strictEqual(sum.loadSuccessCount, 20);
          assert.strictEqual(sum.loadFailureCount, 5);
          assert.strictEqual(sum.totalLoadTime, 300);
          assert.strictEqual(sum.evictionCount, 8);
        });

        it("should correctly sum large numbers", () => {
          const statsC = CacheStats.of(Number.MAX_VALUE, 1, 1, 1, 1, 1);
          const statsD = CacheStats.of(Number.MAX_VALUE, 1, 1, 1, 1, 1);
          const sum = statsC.plus(statsD);
          assert.strictEqual(sum.hitCount, Infinity, "Summing MAX_VALUE should result in Infinity");
        });
      });

      describe("minus()", () => {
        it("should correctly subtract one CacheStats instance from another, flooring at 0", () => {
          const diff = stats2.minus(stats1);
          assert.strictEqual(diff.hitCount, 10);
          assert.strictEqual(diff.missCount, 5);
          assert.strictEqual(diff.loadSuccessCount, 4);
          assert.strictEqual(diff.loadFailureCount, 1);
          assert.strictEqual(diff.totalLoadTime, 100);
          assert.strictEqual(diff.evictionCount, 2);
        });

        it("should floor results at 0 if minuend is smaller than subtrahend", () => {
          const sSmall = CacheStats.of(5, 2, 1, 0, 10, 1);
          const sLarge = CacheStats.of(10, 5, 2, 1, 20, 2);
          const diff = sSmall.minus(sLarge);
          assert.strictEqual(diff.hitCount, 0, "hitCount should be floored at 0 (5 - 10)");
          assert.strictEqual(diff.missCount, 0, "missCount should be floored at 0 (2 - 5)");
          assert.strictEqual(diff.loadSuccessCount, 0, "loadSuccessCount should be floored at 0 (1 - 2)");
          assert.strictEqual(diff.loadFailureCount, 0, "loadFailureCount should be floored at 0 (0 - 1)");
          assert.strictEqual(diff.totalLoadTime, 0, "totalLoadTime should be floored at 0 (10 - 20)");
          assert.strictEqual(diff.evictionCount, 0, "evictionCount should be floored at 0 (1 - 2)");
        });
      });

      describe("hitRate()", () => {
        it("should return 0 if requestCount is 0", () => {
          const stats = CacheStats.of(0, 0, 0, 0, 0, 0);
          assert.strictEqual(stats.hitRate(), 1);
        });
        it("should return 0 if hitCount is 0 but missCount > 0", () => {
          const stats = CacheStats.of(0, 1, 0, 0, 0, 0);
          assert.strictEqual(stats.hitRate(), 0);
        });
        it("should return 1 if missCount is 0 but hitCount > 0", () => {
          const stats = CacheStats.of(1, 0, 0, 0, 0, 0);
          assert.strictEqual(stats.hitRate(), 1);
        });
      });

      describe("missRate()", () => {
        it("should return 0 if requestCount is 0", () => {
          const stats = CacheStats.of(0, 0, 0, 0, 0, 0);
          assert.strictEqual(stats.missRate(), 0);
        });
        it("should return 1 if hitCount is 0 but missCount > 0", () => {
          const stats = CacheStats.of(0, 1, 0, 0, 0, 0);
          assert.strictEqual(stats.missRate(), 1);
        });
        it("should return 0 if missCount is 0 but hitCount > 0", () => {
          const stats = CacheStats.of(1, 0, 0, 0, 0, 0);
          assert.strictEqual(stats.missRate(), 0);
        });
      });

      describe("loadFailureRate()", () => {
        it("should return 0 if loadCount is 0", () => {
          const stats = CacheStats.of(0, 0, 0, 0, 0, 0);
          assert.strictEqual(stats.loadFailureRate(), 0);
        });
        it("should return 0 if loadFailureCount is 0 but loadSuccessCount > 0", () => {
          const stats = CacheStats.of(0, 0, 1, 0, 10, 0);
          assert.strictEqual(stats.loadFailureRate(), 0);
        });
        it("should return 1 if loadSuccessCount is 0 but loadFailureCount > 0", () => {
          const stats = CacheStats.of(0, 0, 0, 1, 10, 0);
          assert.strictEqual(stats.loadFailureRate(), 1);
        });
      });

      describe("averageLoadPenalty()", () => {
        it("should return 0 if loadCount is 0, even if totalLoadTime > 0", () => {
          const stats = CacheStats.of(0, 0, 0, 0, 100, 0);
          assert.strictEqual(stats.averageLoadPenalty(), 0);
        });
        it("should return 0 if totalLoadTime is 0 and loadCount > 0", () => {
          const stats = CacheStats.of(0, 0, 1, 1, 0, 0);
          assert.strictEqual(stats.averageLoadPenalty(), 0);
        });
      });
    });
  });
  describe('comprehensive stats', () => {
    const csc = new BasicClientSideCache({
      maxEntries: 2, // Small size to easily trigger evictions
    });

    testUtils.testWithClient('should reflect comprehensive cache operations in stats via BasicClientSideCache', async client => {

      // --- Phase 1: Initial misses and loads ---
      await client.set('keyA', 'valueA_1');
      assert.strictEqual(await client.get('keyA'), 'valueA_1', "Get keyA first time");
      assert.strictEqual(csc.stats().missCount, 1);
      assert.strictEqual(csc.stats().loadSuccessCount, 1);

      await client.set('keyB', 'valueB_1');
      assert.strictEqual(await client.get('keyB'), 'valueB_1', "Get keyB first time");
      assert.strictEqual(csc.stats().missCount, 2);
      assert.strictEqual(csc.stats().loadSuccessCount, 2);

      // --- Phase 2: Cache hits ---
      assert.strictEqual(await client.get('keyA'), 'valueA_1', "Get keyA second time (hit)");
      assert.strictEqual(csc.stats().hitCount, 1);

      assert.strictEqual(await client.get('keyB'), 'valueB_1', "Get keyB second time (hit)");
      assert.strictEqual(csc.stats().hitCount, 2);


      // --- Phase 3: Trigger evictions and more misses/loads ---
      await client.set('keyC', 'valueC_1');
      assert.strictEqual(await client.get('keyC'), 'valueC_1', "Get keyC first time (evicts keyA)");
      assert.strictEqual(csc.stats().missCount, 3);
      assert.strictEqual(csc.stats().loadSuccessCount, 3);
      assert.strictEqual(csc.stats().evictionCount, 1);


      assert.strictEqual(await client.get('keyA'), 'valueA_1', "Get keyA again (miss after eviction)");
      assert.strictEqual(csc.stats().missCount, 4);
      assert.strictEqual(csc.stats().loadSuccessCount, 4);
      assert.strictEqual(csc.stats().evictionCount, 2);


      // --- Phase 4: More hits ---
      assert.strictEqual(await client.get('keyC'), 'valueC_1', "Get keyC again (hit)");
      assert.strictEqual(csc.stats().hitCount, 3);

      // --- Phase 5: Update a key (results in invalidation, then miss/load on next GET) ---
      // Note: A SET operation on an existing cached key should invalidate it.
      // The invalidation itself isn't directly a "hit" or "miss" for stats,
      // but the *next* GET will be a miss.
      await client.set('keyA', 'valueA_2');
      assert.strictEqual(await client.get('keyA'), 'valueA_2', "Get keyA after SET (miss due to invalidation)");

      assert.strictEqual(csc.stats().hitCount, 3);
      assert.strictEqual(csc.stats().loadSuccessCount, 5);



      const stats = csc.stats()

      assert.strictEqual(stats.hitCount, 3, "Final hitCount");
      assert.strictEqual(stats.missCount, 5, "Final missCount");
      assert.strictEqual(stats.loadSuccessCount, 5, "Final loadSuccessCount");
      assert.strictEqual(stats.loadFailureCount, 0, "Final loadFailureCount (expected 0 for this test)");
      assert.strictEqual(stats.evictionCount, 2, "Final evictionCount");
      assert.ok(stats.totalLoadTime >= 0, "Final totalLoadTime should be non-negative");

      assert.strictEqual(stats.requestCount(), 8, "Final requestCount (5 misses + 3 hits)");
      assert.strictEqual(stats.hitRate(), 3 / 8, "Final hitRate");
      assert.strictEqual(stats.missRate(), 5 / 8, "Final missRate");

      assert.strictEqual(stats.loadCount(), 5, "Final loadCount (5 success + 0 failure)");
      assert.strictEqual(stats.loadFailureRate(), 0, "Final loadFailureRate (0 failures / 5 loads)");

      if (stats.loadCount() > 0) {
        assert.ok(stats.averageLoadPenalty() >= 0, "Final averageLoadPenalty should be non-negative");
        assert.strictEqual(stats.averageLoadPenalty(), stats.totalLoadTime / stats.loadCount(), "Average load penalty calculation");
      } else {
        assert.strictEqual(stats.averageLoadPenalty(), 0, "Final averageLoadPenalty should be 0 if no loads");
      }

    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3,
        clientSideCache: csc
      }
    });
  });

  describe('Tracking modes', () => {
    describe('trackingOn()', () => {
      it('plain by default', () => {
        assert.deepEqual(new BasicClientSideCache().trackingOn(), ['CLIENT', 'TRACKING', 'ON']);
      });

      it('optin', () => {
        assert.deepEqual(
          new BasicClientSideCache({ trackingMode: 'optin' }).trackingOn(),
          ['CLIENT', 'TRACKING', 'ON', 'OPTIN']
        );
      });

      it('optout', () => {
        assert.deepEqual(
          new BasicClientSideCache({ trackingMode: 'optout' }).trackingOn(),
          ['CLIENT', 'TRACKING', 'ON', 'OPTOUT']
        );
      });
    });

    describe('resolveCacheIntent()', () => {
      const userOnly = (_command: string, keys: ReadonlyArray<unknown>) => String(keys[0]).startsWith('user:');

      it('the mark wins over the predicate', () => {
        const cache = new BasicClientSideCache({ trackingMode: 'optin', cacheable: userOnly });
        assert.equal(cache.resolveCacheIntent(true, 'GET', ['counter:1']), true);
        assert.equal(cache.resolveCacheIntent(false, 'GET', ['user:1']), false);
      });

      it('the predicate answers unmarked calls', () => {
        const cache = new BasicClientSideCache({ trackingMode: 'optin', cacheable: userOnly });
        assert.equal(cache.resolveCacheIntent(undefined, 'GET', ['user:1']), true);
        assert.equal(cache.resolveCacheIntent(undefined, 'GET', ['counter:1']), false);
      });

      it('without a predicate, the mode decides', () => {
        assert.equal(new BasicClientSideCache().resolveCacheIntent(undefined, 'GET', ['k']), true);
        assert.equal(new BasicClientSideCache({ trackingMode: 'optin' }).resolveCacheIntent(undefined, 'GET', ['k']), false);
        assert.equal(new BasicClientSideCache({ trackingMode: 'optout' }).resolveCacheIntent(undefined, 'GET', ['k']), true);
      });
    });

    describe('handleCache() with isStorable() false', () => {
      function getParser() {
        const parser = new BasicCommandParser();
        parser.push('GET');
        parser.pushKey('k');
        return parser;
      }

      it('returns the reply and stores nothing, for the loader and a concurrent waiter', async () => {
        const cache = new BasicClientSideCache({ trackingMode: 'optin' });
        let resolve!: (value: string) => void;
        const loaded = new Promise<string>(r => resolve = r);
        let calls = 0;
        const fn = () => {
          calls++;
          return loaded;
        };

        // The loader's own flag says "not tracked"; the waiter's is never set (its fn never
        // runs), mirroring the client, so the waiter relies on the loader dropping the entry.
        const first = cache.handleCache({} as never, getParser(), fn as never, undefined, undefined, () => false);
        const waiter = cache.handleCache({} as never, getParser(), fn as never, undefined, undefined, () => true);
        resolve('v');

        assert.deepEqual(await Promise.all([first, waiter]), ['v', 'v']);
        assert.equal(calls, 1, 'the waiter reuses the in-flight load');
        assert.equal(cache.size(), 0, 'nothing stored');
      });
    });

    describe('optin', () => {
      const csc = new BasicClientSideCache({ trackingMode: 'optin' });

      testUtils.testWithClient('enables OPTIN tracking', async client => {
        const { flags } = await client.clientTrackingInfo() as unknown as { flags: Array<string> };
        assert.ok(flags.includes('optin'), `flags: ${flags}`);
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      testUtils.testWithClient('an unmarked read is not stored', async client => {
        csc.clear();

        await client.set('x', 1);
        assert.equal(await client.get('x'), '1');
        assert.equal(await client.get('x'), '1');

        assert.equal(csc.stats().hitCount, 0, 'Cache Hits');
        assert.equal(csc.size(), 0, 'Cache Size');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      testUtils.testWithClient('a read marked cache: true is stored', async client => {
        csc.clear();
        const cached = client.withCommandOptions({ cache: true });

        await client.set('x', 1);
        assert.equal(await cached.get('x'), '1');
        assert.equal(await cached.get('x'), '1');

        assert.equal(csc.stats().missCount, 1, 'Cache Misses');
        assert.equal(csc.stats().hitCount, 1, 'Cache Hits');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      testUtils.testWithClient('a stored key modified by another client is invalidated', async client => {
        csc.clear();
        const cached = client.withCommandOptions({ cache: true });
        const writer = client.duplicate({ clientSideCache: undefined });
        await writer.connect();

        try {
          await writer.set('x', 1);
          assert.equal(await cached.get('x'), '1');
          assert.equal(csc.size(), 1, 'stored');

          const invalidated = once(csc, 'invalidate');
          await writer.set('x', 2);
          await invalidated;

          assert.equal(csc.size(), 0, 'invalidated');
          assert.equal(await cached.get('x'), '2');
        } finally {
          writer.destroy();
        }
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      const userOnly = new BasicClientSideCache({
        trackingMode: 'optin',
        cacheable: (_command, keys) => keys[0].toString().startsWith('user:')
      });

      testUtils.testWithClient('the predicate selects what is stored', async client => {
        userOnly.clear();

        await client.mSet({ 'user:1': 'a', 'counter:1': 'b' });
        await client.get('user:1');
        await client.get('counter:1');

        assert.equal(userOnly.size(), 1, 'Cache Size');
        await client.get('user:1');
        assert.equal(userOnly.stats().hitCount, 1, 'Cache Hits');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: userOnly }
      });

      testUtils.testWithClient('a failed read surfaces its error and stores nothing', async client => {
        csc.clear();

        await client.lPush('list', 'a');
        await assert.rejects(client.withCommandOptions({ cache: true }).get('list'), /WRONGTYPE/);

        assert.equal(csc.size(), 0, 'Cache Size');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      describe('CLIENT CACHING denied by ACL', () => {
        testUtils.isVersionGreaterThanHook([7]);

        testUtils.testWithClient('the reply is returned and nothing is stored', async client => {
          await client.sendCommand([
            'ACL', 'SETUSER', 'csc-no-caching', 'on', '>password', '~*', '&*', '+@all', '-client|caching'
          ]);

          const cache = new BasicClientSideCache({ trackingMode: 'optin' });
          const restricted = client.duplicate({
            username: 'csc-no-caching',
            password: 'password',
            clientSideCache: cache
          });
          await restricted.connect();

          try {
            await restricted.set('x', 1);
            assert.equal(await restricted.withCommandOptions({ cache: true }).get('x'), '1');
            assert.equal(cache.size(), 0, 'Cache Size');
          } finally {
            restricted.destroy();
            await client.sendCommand(['ACL', 'DELUSER', 'csc-no-caching']);
          }
        }, {
          ...GLOBAL.SERVERS.OPEN,
          clientOptions: { RESP: 3 }
        });
      });
    });

    describe('optout', () => {
      const csc = new BasicClientSideCache({ trackingMode: 'optout' });

      testUtils.testWithClient('enables OPTOUT tracking', async client => {
        const { flags } = await client.clientTrackingInfo() as unknown as { flags: Array<string> };
        assert.ok(flags.includes('optout'), `flags: ${flags}`);
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      testUtils.testWithClient('an unmarked read is stored', async client => {
        csc.clear();

        await client.set('x', 1);
        assert.equal(await client.get('x'), '1');
        assert.equal(await client.get('x'), '1');

        assert.equal(csc.stats().missCount, 1, 'Cache Misses');
        assert.equal(csc.stats().hitCount, 1, 'Cache Hits');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      testUtils.testWithClient('a read marked cache: false is not stored', async client => {
        csc.clear();
        const fresh = client.withCommandOptions({ cache: false });

        await client.set('x', 1);
        assert.equal(await fresh.get('x'), '1');
        assert.equal(await fresh.get('x'), '1');

        assert.equal(csc.stats().hitCount, 0, 'Cache Hits');
        assert.equal(csc.size(), 0, 'Cache Size');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc }
      });

      // R5: the flag and its read must be admitted together. When the queue has room
      // for the flag but not the read, a stray CLIENT CACHING NO must not reach the
      // wire, or it untracks the next read and that read's cached reply goes stale.
      testUtils.testWithClient('a read rejected by a full queue does not leave CACHING NO for the next read', async client => {
        csc.clear();
        const writer = client.duplicate({ clientSideCache: undefined, commandsQueueMaxLength: undefined });
        await writer.connect();

        try {
          await client.set('x', '1');

          // 9 pending commands + the flag fill the queue (max 10); the read is rejected.
          const pending = Array.from({ length: 9 }, () => client.ping());
          await assert.rejects(
            client.withCommandOptions({ cache: false }).get('x'),
            /The queue is full/
          );
          await Promise.all(pending);

          // Unmarked read under OPTOUT: stored, and must be tracked.
          assert.equal(await client.get('x'), '1');
          assert.equal(csc.size(), 1, 'stored');

          await writer.set('x', '2');
          // The invalidation push for x is written to this connection before the PING
          // reply, so once PING resolves, a tracked entry has already been invalidated.
          await client.ping();

          assert.equal(await client.get('x'), '2', 'the cached reply must not be stale');
        } finally {
          writer.destroy();
        }
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: csc, commandsQueueMaxLength: 10 }
      });
    });

    testUtils.testWithClient('cache: true on an ineligible command executes, stores nothing, and warns on every call', async client => {
      const originalWarn = console.warn;
      const warnings: Array<unknown> = [];
      console.warn = (...args: Array<unknown>) => { warnings.push(args[0]); };

      try {
        const cache = client.clientSideCache!;
        await client.set('x', 1);
        assert.equal(await client.withCommandOptions({ cache: true }).touch('x'), 1);
        assert.equal(await client.withCommandOptions({ cache: true }).touch('x'), 1);

        assert.equal(cache.size(), 0, 'Cache Size');
        assert.equal(warnings.filter(w => String(w).includes('TOUCH')).length, 2, 'warned on each call');
      } finally {
        console.warn = originalWarn;
      }
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optin' } }
    });

    testUtils.testWithClient('strict: cache: true on an ineligible command rejects before the command is sent', async client => {
      await client.set('x', 1);
      await client.configResetStat();

      await assert.rejects(
        client.withCommandOptions({ cache: true }).touch('x'),
        (err: unknown) => err instanceof ClientSideCacheMarkError && err.command === 'TOUCH'
      );

      assert.equal(await client.touch('x'), 1, 'unmarked calls are unaffected');
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optin', strict: true } }
    });

    describe('cluster', () => {
      const optin = new BasicPooledClientSideCache({ trackingMode: 'optin' });

      testUtils.testWithCluster('optin: only marked reads are stored', async cluster => {
        optin.clear();

        await cluster.set('x', 1);
        await cluster.set('y', 1);
        await cluster.get('x');
        assert.equal(await cluster.withCommandOptions({ cache: true }).get('y'), '1');
        assert.equal(await cluster.withCommandOptions({ cache: true }).get('y'), '1');

        assert.equal(optin.size(), 1, 'Cache Size');
        assert.equal(optin.stats().hitCount, 1, 'Cache Hits');
      }, {
        ...GLOBAL.CLUSTERS.OPEN,
        clusterConfiguration: { RESP: 3, clientSideCache: optin }
      });

      const optout = new BasicPooledClientSideCache({ trackingMode: 'optout' });

      testUtils.testWithCluster('optout: reads marked cache: false are not stored', async cluster => {
        optout.clear();

        await cluster.set('x', 1);
        await cluster.set('y', 1);
        await cluster.get('x');
        assert.equal(await cluster.withCommandOptions({ cache: false }).get('y'), '1');

        assert.equal(optout.size(), 1, 'Cache Size');
      }, {
        ...GLOBAL.CLUSTERS.OPEN,
        clusterConfiguration: { RESP: 3, clientSideCache: optout }
      });
    });

    describe('user-sent CLIENT CACHING / CLIENT TRACKING', () => {
      const isRefused = (command: string) =>
        (err: unknown) => err instanceof ClientSideCacheCommandError && err.command === command;

      testUtils.testWithClient('CLIENT CACHING is refused', async client => {
        await assert.rejects(client.clientCaching(true), isRefused('CLIENT CACHING'));
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optin' } }
      });

      const plain = new BasicClientSideCache();

      testUtils.testWithClient('CLIENT TRACKING is refused in plain mode, and tracking stays on', async client => {
        plain.clear();
        const writer = client.duplicate({ clientSideCache: undefined });
        await writer.connect();

        try {
          await assert.rejects(client.clientTracking(false), isRefused('CLIENT TRACKING'));

          await writer.set('x', 1);
          assert.equal(await client.get('x'), '1');
          assert.equal(plain.size(), 1, 'stored');

          const invalidated = once(plain, 'invalidate');
          await writer.set('x', 2);
          await invalidated;

          assert.equal(plain.size(), 0, 'invalidated');
        } finally {
          writer.destroy();
        }
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: plain }
      });

      testUtils.testWithClient('raw sendCommand is refused, in any case and with Buffer arguments', async client => {
        await assert.rejects(client.sendCommand(['client', 'tracking', 'off']), isRefused('CLIENT TRACKING'));
        await assert.rejects(
          client.sendCommand([Buffer.from('CLIENT'), Buffer.from('CACHING'), 'YES']),
          isRefused('CLIENT CACHING')
        );
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optout' } }
      });

      testUtils.testWithClient('MULTI and pipelines are refused before anything is sent', async client => {
        await assert.rejects(
          client.multi().set('multi', '1').clientTracking(false).exec(),
          isRefused('CLIENT TRACKING')
        );
        await assert.rejects(
          client.multi().set('pipeline', '1').clientCaching(true).execAsPipeline(),
          isRefused('CLIENT CACHING')
        );

        assert.equal(await client.exists(['multi', 'pipeline']), 0, 'nothing was sent');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optin' } }
      });

      testUtils.testWithClient('other CLIENT subcommands are allowed', async client => {
        const info = await client.clientTrackingInfo();
        assert.ok(info.flags.includes('optin'));
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3, clientSideCache: { trackingMode: 'optin' } }
      });

      testUtils.testWithClient('without client-side caching, CLIENT TRACKING is allowed', async client => {
        assert.equal(await client.clientTracking(true), 'OK');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: { RESP: 3 }
      });

      testUtils.testWithCluster('cluster: raw sendCommand is refused', async cluster => {
        await assert.rejects(
          cluster.sendCommand(undefined, true, ['CLIENT', 'TRACKING', 'OFF']),
          isRefused('CLIENT TRACKING')
        );
      }, {
        ...GLOBAL.CLUSTERS.OPEN,
        clusterConfiguration: { RESP: 3, clientSideCache: { trackingMode: 'optin' } }
      });
    });
  });
});
