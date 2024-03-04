import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ScanOptions } from './generic-transformers';
import { HScanRawReply, transformArguments as transformHScanArguments } from './HSCAN';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './HSCAN';

export function transformArguments(
    key: RedisCommandArgument,
    cursor: number,
    options?: ScanOptions
): RedisCommandArguments {
    const args = transformHScanArguments(key, cursor, options);
    args.push('NOVALUES');
    return args;
}

interface HScanNoValuesReply {
    cursor: number;
    keys: Array<RedisCommandArgument>;
}

export function transformReply([cursor, rawData]: HScanRawReply): HScanNoValuesReply {
    return {
        cursor: Number(cursor),
        keys: [...rawData]
    };
}
