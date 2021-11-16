import { LMoveSide } from './LMOVE';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: string,
    destination: string,
    sourceDirection: LMoveSide,
    destinationDirection: LMoveSide,
    timeout: number
): Array<string> {
    return [
        'BLMOVE',
        source,
        destination,
        sourceDirection,
        destinationDirection,
        timeout.toString()
    ];
}

export declare function transformReply(): string | null;
