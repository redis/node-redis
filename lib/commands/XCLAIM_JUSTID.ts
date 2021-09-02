import { transformReplyStringArray } from './generic-transformers';
import { transformArguments as transformArgumentsXClaim } from './XCLAIM';

export { FIRST_KEY_INDEX } from './XCLAIM';

export function transformArguments(...args: Parameters<typeof transformArgumentsXClaim>): Array<string> {
    return [
        ...transformArgumentsXClaim(...args),
        'JUSTID'
    ];
}

export const transformReply = transformReplyStringArray;
