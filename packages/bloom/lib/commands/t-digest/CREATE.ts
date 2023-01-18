import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { CompressionOption, pushCompressionArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    options?: CompressionOption
): RedisCommandArguments {
    return pushCompressionArgument(
        ['TDIGEST.CREATE', key],
        options
    );
}

export declare function transformReply(): 'OK';
