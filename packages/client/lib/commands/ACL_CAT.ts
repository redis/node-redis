import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(categoryName?: RedisCommandArgument): RedisCommandArguments {
    const args: RedisCommandArguments = ['ACL', 'CAT'];

    if (categoryName) {
        args.push(categoryName);
    }

    return args;
}

export declare function transformReply(): Array<RedisCommandArgument>;
