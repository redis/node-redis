import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { basename } from 'path';
import { promises as fs } from 'fs';
import * as hdr from 'hdr-histogram-js';
hdr.initWebAssemblySync();

const { path, times, concurrency, 'redis-server-host': host } = yargs(hideBin(process.argv))
    .option('path', {
        type: 'string',
        demandOption: true
    })
    .option('times', {
        type: 'number',
        default: 1_000_000,
        demandOption: true
    })
    .option('concurrency', {
        type: 'number',
        default: 100,
        demandOption: true
    })
    .option('redis-server-host', {
        type: 'string'
    })
    .parseSync();

const [ { metadata, timestamp }, module ] = await Promise.all([
        new Promise(resolve => {
            process.once('message', resolve);
            process.send('ready');
        }),
        import(path)
    ]),
    { benchmark, teardown } = await module.default(host, metadata);

async function run(times) {
    return new Promise(resolve => {
        const histogram = hdr.build({ useWebAssembly: true });
        let num = 0,
            inProgress = 0;

        async function run() {
            ++inProgress;
            ++num;

            const start = process.hrtime.bigint();
            await benchmark(metadata);
            histogram.recordValue(Number(process.hrtime.bigint() - start));
            --inProgress;

            if (num < times) {
                run();
            } else if (inProgress === 0) {
                resolve(histogram);
            }
        }

        const toInitiate = Math.min(concurrency, times);
        for (let i = 0; i < toInitiate; i++) {
            run();
        }
    });
}

// warmup
await run(Math.min(times * 0.1, 10_000));

// benchmark
const benchmarkStart = process.hrtime.bigint(),
    histogram = await run(times),
    benchmarkNanoseconds = process.hrtime.bigint() - benchmarkStart,
    json = {
        timestamp,
        operationsPerSecond: times / Number(benchmarkNanoseconds) * 1_000_000_000,
        p0: histogram.getValueAtPercentile(0),
        p50: histogram.getValueAtPercentile(50),
        p95: histogram.getValueAtPercentile(95),
        p99: histogram.getValueAtPercentile(99),
        p100: histogram.getValueAtPercentile(100)
    };
console.log(`[${basename(path)}]:`);
console.table(json);
await fs.writeFile(`${path}.json`, JSON.stringify(json));

await teardown();
