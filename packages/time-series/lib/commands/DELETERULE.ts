export function transformArguments(sourceKey: string,destinationKey: string,): Array<string> {
    return [
        'TS.DELETERULE',
        sourceKey,
        destinationKey,
    ];
}

export declare function transfromReply(): 'OK';
