import { CommandParser } from "../client/parser";
import { NumberReply, Command, RedisArgument } from "../RESP/types";
import { transformEXAT, transformPXAT } from "./generic-transformers";
import { MSetArguments } from "./MSET";

export const SetMode = {
  /**
   * Only set if all keys exist
   */
  XX: "XX",
  /**
   * Only set if none of the keys exist
   */
  NX: "NX",
} as const;

export type SetMode = (typeof SetMode)[keyof typeof SetMode];

export const ExpirationMode = {
  /**
   * Relative expiration (seconds)
   */
  EX: "EX",
  /**
   * Relative expiration (milliseconds)
   */
  PX: "PX",
  /**
   * Absolute expiration (Unix timestamp in seconds)
   */
  EXAT: "EXAT",
  /**
   * Absolute expiration (Unix timestamp in milliseconds)
   */
  PXAT: "PXAT",
  /**
   * Keep existing TTL
   */
  KEEPTTL: "KEEPTTL",
} as const;

export type ExpirationMode =
  (typeof ExpirationMode)[keyof typeof ExpirationMode];

type SetConditionOption = typeof SetMode.XX | typeof SetMode.NX;

type ExpirationOption =
  | { type: typeof ExpirationMode.EX; value: number }
  | { type: typeof ExpirationMode.PX; value: number }
  | { type: typeof ExpirationMode.EXAT; value: number | Date }
  | { type: typeof ExpirationMode.PXAT; value: number | Date }
  | { type: typeof ExpirationMode.KEEPTTL };

export function parseMSetExArguments(
  parser: CommandParser,
  keyValuePairs: MSetArguments
) {
  let tuples: Array<[RedisArgument, RedisArgument]> = [];

  if (Array.isArray(keyValuePairs)) {
    if (keyValuePairs.length == 0) {
      throw new Error("empty keyValuePairs Argument");
    }
    if (Array.isArray(keyValuePairs[0])) {
      tuples = keyValuePairs as Array<[RedisArgument, RedisArgument]>;
    } else {
      const arr = keyValuePairs as Array<RedisArgument>;
      for (let i = 0; i < arr.length; i += 2) {
        tuples.push([arr[i], arr[i + 1]]);
      }
    }
  } else {
    for (const tuple of Object.entries(keyValuePairs)) {
      tuples.push([tuple[0], tuple[1]]);
    }
  }

  // Push the number of keys
  parser.push(tuples.length.toString());

  for (const tuple of tuples) {
    parser.pushKey(tuple[0]);
    parser.push(tuple[1]);
  }
}

export default {
  /**
   * Constructs the MSETEX command.
   *
   * Atomically sets multiple string keys with a shared expiration in a single operation.
   *
   * @param parser - The command parser
   * @param keyValuePairs - Key-value pairs to set (array of tuples, flat array, or object)
   * @param options - Configuration for expiration and set modes
   * @see https://redis.io/commands/msetex/
   */
  parseCommand(
    parser: CommandParser,
    keyValuePairs: MSetArguments,
    options?: {
      expiration?: ExpirationOption;
      mode?: SetConditionOption;
    }
  ) {
    parser.push("MSETEX");

    // Push number of keys and key-value pairs before the options
    parseMSetExArguments(parser, keyValuePairs);

    if (options?.mode) {
      parser.push(options.mode);
    }

    if (options?.expiration) {
      switch (options.expiration.type) {
        case ExpirationMode.EXAT:
          parser.push(
            ExpirationMode.EXAT,
            transformEXAT(options.expiration.value)
          );
          break;
        case ExpirationMode.PXAT:
          parser.push(
            ExpirationMode.PXAT,
            transformPXAT(options.expiration.value)
          );
          break;
        case ExpirationMode.KEEPTTL:
          parser.push(ExpirationMode.KEEPTTL);
          break;
        case ExpirationMode.EX:
        case ExpirationMode.PX:
          parser.push(
            options.expiration.type,
            options.expiration.value?.toString()
          );
          break;
      }
    }
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>,
} as const satisfies Command;
