import { transformEXAT, transformPXAT, transformReplyStringNull } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

type GetExModes = {
    EX: number;
} | {
    PX: number;
} | {
    EXAT: number | Date;
} | {
    PXAT: number | Date;
} | {
    PERSIST: true;
};

export function transformArguments(key: string, mode: GetExModes) {
    const args = ['GETEX', key];

    if ('EX' in mode) {
        args.push('EX', mode.EX.toString());
    } else if ('PX' in mode) {
        args.push('PX', mode.PX.toString());
    } else if ('EXAT' in mode) {
        args.push('EXAT', transformEXAT(mode.EXAT));
    } else if ('PXAT' in mode) {
        args.push('PXAT', transformPXAT(mode.PXAT));
    } else { // PERSIST
        args.push('PERSIST');
    }

    return args;
}

export const transformReply = transformReplyStringNull;
