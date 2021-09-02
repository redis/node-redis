import { transformReplyStringNull } from './generic-transformers';

export type LMoveSide = 'LEFT' | 'RIGHT';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: string,
    destination: string,
    sourceSide: LMoveSide,
    destinationSide: LMoveSide
): Array<string> {
    return [
        'LMOVE',
        source,
        destination,
        sourceSide,
        destinationSide,
    ];
}

export const transformReply = transformReplyStringNull;
