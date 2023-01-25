import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(message?: RedisCommandArgument): RedisCommandArguments {
    const args: RedisCommandArguments = ['PING'];
    if (message) {
        args.push(message);
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument;
