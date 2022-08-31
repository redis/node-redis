export const FIRST_KEY_INDEX = 1;

export function transformArguments(sourceKey: string, destinationKey: string): Array<string> {
    return [
        'TS.DELETERULE',
        sourceKey,
        destinationKey
    ];
}

export declare function transformReply(): 'OK';
