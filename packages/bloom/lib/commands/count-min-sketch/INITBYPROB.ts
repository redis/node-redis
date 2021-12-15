export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, error: number, probability: number): Array<string> {
    return ['CMS.INITBYPROB', key, error.toString(), probability.toString()];
}

export declare function transformReply(): 'OK';
