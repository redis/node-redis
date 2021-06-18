import { transformArguments as transformHRandFieldArguments } from './HRANDFIELD';

export { FIRST_KEY_INDEX } from './HRANDFIELD';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformHRandFieldArguments(key),
        count.toString()
    ];
}

export function transformReply(reply: Array<string> | null): Array<string> | null {
    return reply;
}
