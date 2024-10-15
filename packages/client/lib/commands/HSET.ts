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
  FIRST_KEY_INDEX: 1,
  transformArguments(...[key, value, fieldValue]: SingleFieldArguments | MultipleFieldsArguments) {
    const args: Array<RedisArgument> = ['HSET', key];

    if (typeof value === 'string' || typeof value === 'number' || value instanceof Buffer) {
      args.push(
        convertValue(value),
        convertValue(fieldValue!)
      );
    } else if (value instanceof Map) {
      pushMap(args, value);
    } else if (Array.isArray(value)) {
      pushTuples(args, value);
    } else {
      pushObject(args, value);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushMap(args: Array<RedisArgument>, map: HSETMap): void {
  for (const [key, value] of map.entries()) {
    args.push(
      convertValue(key),
      convertValue(value)
    );
  }
}

function pushTuples(args: Array<RedisArgument>, tuples: HSETTuples): void {
  for (const tuple of tuples) {
    if (Array.isArray(tuple)) {
      pushTuples(args, tuple);
      continue;
    }

    args.push(convertValue(tuple));
  }
}

function pushObject(args: Array<RedisArgument>, object: HSETObject): void {
  for (const key of Object.keys(object)) {
    args.push(
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
