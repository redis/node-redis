import { CommandParser } from "../client/parser";
import { Command, RedisArgument, SimpleStringReply } from "../RESP/types";

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push("DIGEST");
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply,
} as const satisfies Command;
