import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    member: RedisCommandArgument
): RedisCommandArguments {
    return ['SMOVE', source, destination, member];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
