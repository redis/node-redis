import { transformArguments as transformZRandMemberArguments } from './ZRANDMEMBER';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANDMEMBER';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformZRandMemberArguments(key),
        count.toString()
    ];
}

export declare function transformReply(): Array<string>;
