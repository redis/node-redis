import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { basename } from 'path';

const { path, times, concurrency } = yargs(hideBin(process.argv))
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
    .parseSync();

async function setup() {
    const module = await import(path);
    await module.setup();
    return module;
}

function getMetadata() {
    return new Promise(resolve => {
        process.once('message', resolve);
        process.send('ready');
    });
}

const [ { benchmark, teardown }, metadata ] = await Promise.all([
    setup(),
    getMetadata()
]);

async function run(times) {
    return new Promise(resolve => {
        let num = 0,
            inProgress = 0;

        function run() {
            ++inProgress;
            ++num;
            benchmark(metadata)
                .catch(err => console.error(err))
                .finally(() => {
                    --inProgress;

                    if (num < times) {
                        run();
                    } else if (inProgress === 0) {
                        resolve();
                    }
                });
        }

        for (let i = 0; i < concurrency; i++) {
            run();
        }
    });
}

// warmup
await run(Math.min(times * 0.1, 10_000));

// benchmark
const start = process.hrtime.bigint();
await run(times);
const took = (process.hrtime.bigint() - start);
console.log(`[${basename(path)}]: took ${took / 1_000_000n}ms, ${took / BigInt(times)}ns per operation`);

await teardown();
