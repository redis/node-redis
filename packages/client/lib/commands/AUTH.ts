import { RedisCommandArgument, RedisCommandArguments } from '.';

export interface AuthOptions {
    username?: RedisCommandArgument;
    password: RedisCommandArgument;
}

export function transformArguments({ username, password }: AuthOptions): RedisCommandArguments {
    if (!username) {
        return ['AUTH', password];
    }

    return ['AUTH', username, password];
}

export declare function transformReply(): RedisCommandArgument;
