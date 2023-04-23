import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVariadicArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    destination: RedisCommandArgument,
    keys: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVariadicArguments(['SUNIONSTORE', destination], keys);
}

export declare function transformReply(): number;
