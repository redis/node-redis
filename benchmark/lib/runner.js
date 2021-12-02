import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { basename } from 'path';
import * as hdr from 'hdr-histogram-js';
hdr.initWebAssemblySync();

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
        const histogram = hdr.build({ useWebAssembly: true });
        let num = 0,
            inProgress = 0;

        function run() {
            ++inProgress;
            ++num;

            const start = process.hrtime.bigint();
            benchmark(metadata)
                .catch(err => console.error(err))
                .finally(() => {
                    histogram.recordValue(Number(process.hrtime.bigint() - start));
                    --inProgress;

                    if (num < times) {
                        run();
                    } else if (inProgress === 0) {
                        resolve(histogram);
                    }
                });
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
const histogram = await run(times);
console.log(`[${basename(path)}]:`);
console.table(histogram.toJSON());

await teardown();
