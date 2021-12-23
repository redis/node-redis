import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(bits?: number): RedisCommandArguments {
    const args = ['ACL', 'GENPASS'];

    if (bits) {
        args.push(bits.toString());
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument;
