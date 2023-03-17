export const FIRST_KEY_INDEX = 2;

export function transformArguments(name: string, index: string): Array<string> {
    return ['FT.ALIASUPDATE', name, index];
}

export declare function transformReply(): 'OK';
