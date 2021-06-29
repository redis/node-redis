import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

type BitFieldType = string; // TODO 'i[1-64]' | 'u[1-63]'

interface BitFieldOptions {
    GET?: {
        type: BitFieldType;
        offset: number | string;
    };
    SET?: {
        type: BitFieldType;
        offset: number | string;
        value: number;
    };
    INCRBY?: {
        type: BitFieldType;
        offset: number | string;
        increment: number;
    };
    OVERFLOW?: 'WRAP' | 'SAT' | 'FAIL';
}

export function transformArguments(key: string, options?: BitFieldOptions): Array<string> {
    const args = ['BITFIELD', key];

    if (options?.GET) {
        args.push(
            'GET',
            options.GET.type,
            options.GET.offset.toString()
        );
    }

    if (options?.SET) {
        args.push(
            'SET',
            options.SET.type,
            options.SET.offset.toString(),
            options.SET.value.toString()
        );
    }

    if (options?.INCRBY) {
        args.push(
            'INCRBY',
            options.INCRBY.type,
            options.INCRBY.offset.toString(),
            options.INCRBY.increment.toString()
        );
    }

    if (options?.OVERFLOW) {
        args.push(
            'OVERFLOW',
            options.OVERFLOW
        );
    }

    return args;
}

export const transformReply = transformReplyNumber;
