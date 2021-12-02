import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { promises as fs } from 'fs';
import { fork } from 'child_process';
import { URL, fileURLToPath } from 'url';
import { once } from 'events';

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
    path = new URL(`${await getName()}/`, import.meta.url),
    metadata = await import(new URL('index.js', path));

for (const file of await fs.readdir(path)) {
    if (file === 'index.js') continue;

    const benchmarkProcess = fork(runnerPath, [
        ...argv,
        '--path',
        fileURLToPath(path) + file
    ]);

    await once(benchmarkProcess, 'message');
    benchmarkProcess.send(metadata);
    await once(benchmarkProcess, 'close');
}
