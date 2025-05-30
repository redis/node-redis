import { BasicCommandParser, CommandParser } from '../client/parser';
import {  Command, NumberReply, RedisArgument } from '../RESP/types';

export interface HSetExOptions {
    expiration?: {
      type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
      value: number;
    } | {
      type: 'KEEPTTL';
    } | 'KEEPTTL';
    mode?: 'FNX' | 'FXX'
  }

export type HashTypes = RedisArgument | number;

type HSETEXObject = Record<string | number, HashTypes>;

type HSETEXMap = Map<HashTypes, HashTypes>;

type HSETEXTuples = Array<[HashTypes, HashTypes]> | Array<HashTypes>;

export default {
  /**
   * Constructs the HSETEX command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash
   * @param fields - Object, Map, or Array of field-value pairs to set
   * @param options - Optional configuration for expiration and mode settings
   * @see https://redis.io/commands/hsetex/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: HSETEXObject | HSETEXMap | HSETEXTuples,
    options?: HSetExOptions
  ) {
    parser.push('HSETEX');
    parser.pushKey(key);

    if (options?.mode) {
        parser.push(options.mode)
    }
    if (options?.expiration) {
        if (typeof options.expiration === 'string') {
          parser.push(options.expiration);
        } else if (options.expiration.type === 'KEEPTTL') {
          parser.push('KEEPTTL');
        } else {
          parser.push(
            options.expiration.type,
            options.expiration.value.toString()
          );
        }
    }

    parser.push('FIELDS')
    if (fields instanceof Map) {
        pushMap(parser, fields);
    } else if (Array.isArray(fields)) {
        pushTuples(parser, fields);
    } else {
        pushObject(parser, fields);
    }
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;


function pushMap(parser: CommandParser, map: HSETEXMap): void {
    parser.push(map.size.toString())
    for (const [key, value] of map.entries()) {
        parser.push(
            convertValue(key),
            convertValue(value)
        );
    }
}

function pushTuples(parser: CommandParser, tuples: HSETEXTuples): void {
    const tmpParser = new BasicCommandParser
    _pushTuples(tmpParser, tuples)

    if (tmpParser.redisArgs.length%2 != 0) {
        throw Error('invalid number of arguments, expected key value ....[key value] pairs, got key without value')
    }

    parser.push((tmpParser.redisArgs.length/2).toString())
    parser.push(...tmpParser.redisArgs)
}

function _pushTuples(parser: CommandParser, tuples: HSETEXTuples): void {
    for (const tuple of tuples) {
        if (Array.isArray(tuple)) {
            _pushTuples(parser, tuple);
            continue;
        }
        parser.push(convertValue(tuple));
  }
}

function pushObject(parser: CommandParser, object: HSETEXObject): void {
    const len = Object.keys(object).length
    if (len == 0) {
        throw Error('object without keys')
    }

    parser.push(len.toString())
    for (const key of Object.keys(object)) {
        parser.push(
            convertValue(key),
            convertValue(object[key])
        );
    }
}

function convertValue(value: HashTypes): RedisArgument {
    return typeof value === 'number' ? value.toString() : value;
}