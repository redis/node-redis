import { CommandParser } from "../client/parser";
import { NumberReply, Command, RedisArgument } from "../RESP/types";

export const DelexCondition = {
  /**
   * Delete if value equals match-value.
   */
  IFEQ: "IFEQ",
  /**
   * Delete if value does not equal match-value.
   */
  IFNE: "IFNE",
  /**
   * Delete if value digest equals match-digest.
   */
  IFDEQ: "IFDEQ",
  /**
   * Delete if value digest does not equal match-digest.
   */
  IFDNE: "IFDNE",
} as const;

type DelexCondition = (typeof DelexCondition)[keyof typeof DelexCondition];

export default {
  IS_READ_ONLY: false,
  /**
   *
   * @experimental
   *
   * Conditionally removes the specified key based on value or digest comparison.
   *
   * @param parser - The Redis command parser
   * @param key - Key to delete
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    options?: {
      /**
       * The condition to apply when deleting the key.
       * - `IFEQ` - Delete if value equals match-value
       * - `IFNE` - Delete if value does not equal match-value
       * - `IFDEQ` - Delete if value digest equals match-digest
       * - `IFDNE` - Delete if value digest does not equal match-digest
       */
      condition: DelexCondition;
      /**
       * The value or digest to compare against
       */
      matchValue: RedisArgument;
    }
  ) {
    parser.push("DELEX");
    parser.pushKey(key);

    if (options) {
      parser.push(options.condition);
      parser.push(options.matchValue);
    }
  },
  transformReply: undefined as unknown as () => NumberReply<1 | 0>,
} as const satisfies Command;
