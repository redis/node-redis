import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export type HashTypes = RedisArgument | number;

type HSETObject = Record<string | number, HashTypes>;

type HSETMap = Map<HashTypes, HashTypes>;

type HSETTuples = Array<[HashTypes, HashTypes]> | Array<HashTypes>;

type GenericArguments = [key: RedisArgument];

type SingleFieldArguments = [...generic: GenericArguments, field: HashTypes, value: HashTypes];

type MultipleFieldsArguments = [...generic: GenericArguments, value: HSETObject | HSETMap | HSETTuples];

export type HSETArguments = SingleFieldArguments | MultipleFieldsArguments;

export default {
  /**
   * Constructs the HSET command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash
   * @param value - Either the field name (when using single field) or an object/map/array of field-value pairs
   * @param fieldValue - The value to set (only used with single field variant)
   * @see https://redis.io/commands/hset/
   */
  parseCommand(parser: CommandParser, ...[key, value, fieldValue]: SingleFieldArguments | MultipleFieldsArguments) {
    parser.push('HSET');
    parser.pushKey(key);

    if (typeof value === 'string' || typeof value === 'number' || value instanceof Buffer) {
      parser.push(
        convertValue(value),
        convertValue(fieldValue!)
      );
    } else if (value instanceof Map) {
      pushMap(parser, value);
    } else if (Array.isArray(value)) {
      pushTuples(parser, value);
    } else {
      pushObject(parser, value);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushMap(parser: CommandParser, map: HSETMap): void {
  for (const [key, value] of map.entries()) {
    parser.push(
      convertValue(key),
      convertValue(value)
    );
  }
}

function pushTuples(parser: CommandParser, tuples: HSETTuples): void {
  for (const tuple of tuples) {
    if (Array.isArray(tuple)) {
      pushTuples(parser, tuple);
      continue;
    }

    parser.push(convertValue(tuple));
  }
}

function pushObject(parser: CommandParser, object: HSETObject): void {
  for (const key of Object.keys(object)) {
    parser.push(
      convertValue(key),
      convertValue(object[key])
    );
  }
}

function convertValue(value: HashTypes): RedisArgument {
  return typeof value === 'number' ?
    value.toString() :
    value;
}
