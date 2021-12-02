import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { randomBytes } from 'crypto';

const { size } = yargs(hideBin(process.argv))
    .option('size', {
        type: 'number',
        default: 1024,
        demandOption: true
    })
    .parseSync();

export const randomString = randomBytes(size).toString('ascii');
