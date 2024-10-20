import assert from "assert";
import testUtils, { GLOBAL } from "../test-utils"
import { BasicClientSideCache, BasicPooledClientSideCache } from "./cache"
import { REDIS_FLUSH_MODES } from "../commands/FLUSHALL";

describe("Client Side Cache", () => {
    describe('Basic Cache', () => {
        const csc = new BasicClientSideCache();

        testUtils.testWithClient('Basic Cache Miss', async client => {
            csc.clear();

            await client.set("x", 1);
            await client.get("x");

            assert.equal(1, csc.cacheMisses(), "Cache Misses");
            assert.equal(0, csc.cacheHits(), "Cache Hits");
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
            await client.get("x");
            await client.get("x");

            assert.equal(1, csc.cacheMisses(), "Cache Misses");
            assert.equal(1, csc.cacheHits(), "Cache Hits");
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

            assert.equal(1, csc.cacheMisses(), "Cache Misses");
            assert.equal(0, csc.cacheHits(), "Cache Hits");
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
            await client.get("x");
            await client.flushDb(REDIS_FLUSH_MODES.SYNC);
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

        testUtils.testWithClient('Basic Cache Invalidate', async client => {
            csc.clear();

            await client.set("x", 1);
            await client.get("x");
            await client.set("x", 2);
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
    });

    describe("Pooled Cache", () => {
        const csc = new BasicPooledClientSideCache();
        
        testUtils.testWithClientPool('Basic Cache Miss and Clear', async client => {
            csc.clear();

            await client.set("x", 1);
            await client.get("x");

            assert.equal(1, csc.cacheMisses(), "Cache Misses");
            assert.equal(0, csc.cacheHits(), "Cache Hits");
        }, {
            ...GLOBAL.SERVERS.OPEN,
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
            await client.get("x");
            await client.get("x");
            await client.get("x");

            assert.equal(1, csc.cacheMisses(), "Cache Misses");
            assert.equal(2, csc.cacheHits(), "Cache Hits");
        }, {
            ...GLOBAL.SERVERS.OPEN,
            poolOptions: {
                minimum: 5,
                maximum: 5,
                acquireTimeout: 0,
                cleanupDelay: 1,
                clientSideCache: csc
            }
        })

        testUtils.testWithClientPool('Basic Cache Invalidate', async client => {
            csc.clear();

            await client.set("x", 1);
            await client.get("x");
            csc.invalidate("x");
            await client.get("x");
            csc.invalidate("x");
            await client.get("x");
            csc.invalidate("x");
            await client.get("x");

            assert.equal(4, csc.cacheMisses(), "Cache Misses");
            assert.equal(0, csc.cacheHits(), "Cache Hits");
        }, {
            ...GLOBAL.SERVERS.OPEN,
            poolOptions: {
                minimum: 5,
                maximum: 5,
                acquireTimeout: 0,
                cleanupDelay: 1,
                clientSideCache: csc
            }
        })
    });
});