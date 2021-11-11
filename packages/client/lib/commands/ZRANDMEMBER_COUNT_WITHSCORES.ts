import { transformArguments as transformZRandMemberCountArguments } from './ZRANDMEMBER_COUNT';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANDMEMBER_COUNT';

export function transformArguments(...args: Parameters<typeof transformZRandMemberCountArguments>): Array<string> {
    return [
        ...transformZRandMemberCountArguments(...args),
        'WITHSCORES'
    ];
}

export { transformReplySortedSetWithScores as transformReply } from './generic-transformers';
