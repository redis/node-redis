import { Command, RedisArgument } from "@redis/client/dist/lib/RESP/types";
import { CommandParser } from "@redis/client/dist/lib/client/parser";

type RESPReply = Array<string | number | RESPReply>;

export default {
    FIRST_KEY_INDEX: 1,
    IS_READ_ONLY: true,
    parseCommand(parser: CommandParser, key: RedisArgument, path?: string) {
      parser.push('JSON.RESP');
      parser.pushKey(key);
      if (path !== undefined) {
        parser.push(path);
      }
    },
    transformArguments(key: RedisArgument, path?: string): Array<string> { return [] },
    transformReply: undefined as unknown as () => RESPReply
  } as const satisfies Command;