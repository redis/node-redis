import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const { batchSize } = yargs(hideBin(process.argv))
  .option('batch-size', {
    type: 'number',
    default: 100,
    demandOption: true
  })
  .parseSync();
