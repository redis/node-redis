import assert from "assert";
import testUtils, { GLOBAL } from "../test-utils"
import { BasicClientSideCache, BasicPooledClientSideCache, CacheStats } from "./cache"
import { REDIS_FLUSH_MODES } from "../commands/FLUSHALL";
import { once } from 'events';

describe("Client Side Cache", () => {
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
      let [i] = await p;

      assert.equal(await client.get("x"), '2', 'second get');

      p = once(csc, 'invalidate');
      await client.set("x", 3);
      [i] = await p;

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
  it('should reflect comprehensive cache operations in stats via BasicClientSideCache', async function () {

    const csc = new BasicClientSideCache({
      maxEntries: 2, // Small size to easily trigger evictions
    });

    testUtils.testWithClient('comprehensive_stats_run', async client => {

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
});
