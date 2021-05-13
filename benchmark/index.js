const oldRedis = require('redis-old'),
    newRedis = require('redis-new'),
    {promisify} = require('util'),
    {once} = require('events'),
    ITERATIONS = 1_000_000;

function benchmarkCallback(name, fn) {
    return new Promise(resolve => {
        const start = process.hrtime.bigint();

        let counter = 0;

        function iterationCallback(err) {
            if (err) {
                console.error(err);
            }

            if (++counter === ITERATIONS) {
                console.log(`${name} took ${process.hrtime.bigint() - start} nanoseconds`);
                resolve();
            }
        }

        for (let i = 0; i < ITERATIONS; i++) {
            fn(iterationCallback);
        }
    });
}

async function benchmarkPromise(name, fn) {
    const start = process.hrtime.bigint();

    const promises = [];
    for (let i = 0; i < ITERATIONS; i++) {
        promises.push(fn());
    }

    await Promise.all(promises);
    console.log(`${name} took ${process.hrtime.bigint() - start} nanoseconds`);
}

(async () => {
    const oldClient = oldRedis.createClient();
    oldClient.flushallAsync = promisify(oldClient.flushall).bind(oldClient);
    await once(oldClient, 'connect');
    await oldClient.flushallAsync();
    await benchmarkCallback('oldClient.ping', cb => {
        oldClient.ping('key', cb);
    });

    const newClient = newRedis.createClient();
    await newClient.connect();
    await newClient.flushAll();
    await benchmarkPromise('newClient.ping', () => {
        return newClient.ping();
    });
})();
