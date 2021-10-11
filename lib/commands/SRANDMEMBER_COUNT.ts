import { transformArguments as transformSRandMemberArguments } from './SRANDMEMBER';

export { FIRST_KEY_INDEX } from './SRANDMEMBER';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformSRandMemberArguments(key),
        count.toString()
    ];
}

export declare function transformReply(): Array<string>;
