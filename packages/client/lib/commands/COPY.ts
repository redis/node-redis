import { RedisCommandArgument, RedisCommandArguments } from '.';

interface CopyCommandOptions {
    destinationDb?: number;
    replace?: boolean;
}

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    options?: CopyCommandOptions
): RedisCommandArguments {
    const args = ['COPY', source, destination];

    if (options?.destinationDb) {
        args.push('DB', options.destinationDb.toString());
    }

    if (options?.replace) {
        args.push('REPLACE');
    }

    return args;
}

export { transformBooleanReply as transformReply } from './generic-transformers';
