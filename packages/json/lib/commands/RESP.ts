import { CommandParser } from "@redis/client/dist/lib/client/parser";
import { Command, RedisArgument } from "@redis/client/dist/lib/RESP/types";

type RESPReply = Array<string | number | RESPReply>;

export default {
    IS_READ_ONLY: true,
    /**
     * Returns the JSON value at the specified path in RESP (Redis Serialization Protocol) format.
     * Returns the value in RESP form, useful for language-independent processing.
     * 
     * @param parser - The Redis command parser
     * @param key - The key containing the JSON document
     * @param path - Optional path to the value in the document
     */
    parseCommand(parser: CommandParser, key: RedisArgument, path?: string) {
      parser.push('JSON.RESP');
      parser.pushKey(key);
      if (path !== undefined) {
        parser.push(path);
      }
    },
    transformReply: undefined as unknown as () => RESPReply
  } as const satisfies Command;