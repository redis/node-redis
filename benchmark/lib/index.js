import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { promises as fs } from 'fs';
import { fork } from 'child_process';
import { URL, fileURLToPath } from 'url';
import { once } from 'events';
import { extname } from 'path';

async function getPathChoices() {
    const dirents = await fs.readdir(new URL('.', import.meta.url), {
        withFileTypes: true
    });

    const choices = [];
    for (const dirent of dirents) {
        if (!dirent.isDirectory()) continue;

        choices.push(dirent.name);
    }

    return choices;
}

const argv = hideBin(process.argv);

async function getName() {
    return yargs(argv)
        .option('name', {
            demandOption: true,
            choices: await getPathChoices()
        })
        .parseSync().name;
}

const runnerPath = fileURLToPath(new URL('runner.js', import.meta.url)),
    path = new URL(`${await getName()}/`, import.meta.url);

async function getMetadata() {
    try {
        return await import(new URL('index.js', path));
    } catch (err) {
        if (err.code === 'ERR_MODULE_NOT_FOUND') return;

        throw err;
    }
}

const metadata = await getMetadata(),
    timestamp = Date.now();

for (const file of await fs.readdir(path)) {
    if (file === 'index.js' || extname(file) !== '.js') continue;

    const benchmarkProcess = fork(runnerPath, [
        ...argv,
        '--path',
        fileURLToPath(path) + file
    ]);

    await once(benchmarkProcess, 'message');
    benchmarkProcess.send({
        metadata,
        timestamp
    });
    await once(benchmarkProcess, 'close');
}
