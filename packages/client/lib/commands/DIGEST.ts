import { CommandParser } from "../client/parser";
import { Command, RedisArgument, SimpleStringReply } from "../RESP/types";

export default {
  IS_READ_ONLY: true,
  /**
   *
   * @experimental
   *
   * Returns the XXH3 hash of a string value.
   *
   * @param parser - The Redis command parser
   * @param key - Key to get the digest of
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push("DIGEST");
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply,
} as const satisfies Command;
