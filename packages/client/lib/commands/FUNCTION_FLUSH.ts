import { RedisCommandArguments } from '.';

export function transformArguments(mode?: 'ASYNC' | 'SYNC'): RedisCommandArguments {
    const args = ['FUNCTION', 'FLUSH'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): 'OK';
