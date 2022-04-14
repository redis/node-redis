import { RedisCommandArgument, RedisCommandArguments } from '.';
import { SortedSetSide, transformZMPopArguments, ZMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
    timeout: number,
    keys: RedisCommandArgument | Array<RedisCommandArgument>,
    side: SortedSetSide,
    options?: ZMPopOptions
): RedisCommandArguments {
    return transformZMPopArguments(
        ['BZMPOP', timeout.toString()],
        keys,
        side,
        options
    );
}

export { transformReply } from './ZMPOP';
