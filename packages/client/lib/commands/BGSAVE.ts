import { RedisCommandArgument, RedisCommandArguments } from '.';

interface BgSaveOptions {
    SCHEDULE?: true;
}

export function transformArguments(options?: BgSaveOptions): RedisCommandArguments {
    const args = ['BGSAVE'];

    if (options?.SCHEDULE) {
        args.push('SCHEDULE');
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument;
