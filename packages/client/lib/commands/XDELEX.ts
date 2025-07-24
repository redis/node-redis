import { CommandParser } from "../client/parser";
import { RedisArgument, ArrayReply, Command } from "../RESP/types";
import {
  StreamDeletionPolicy,
  StreamDeletionReplyCode,
} from "./common-stream.types";
import { RedisVariadicArgument } from "./generic-transformers";

/**
 * Deletes one or multiple entries from the stream
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XDELEX command to delete one or multiple entries from the stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (deleted), 2 (dangling refs)
   * @see https://redis.io/commands/xdelex/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    id: RedisVariadicArgument,
    policy?: StreamDeletionPolicy
  ) {
    parser.push("XDELEX");
    parser.pushKey(key);

    if (policy) {
      parser.push(policy);
    }

    parser.push("IDS");
    parser.pushVariadicWithLength(id);
  },
  transformReply:
    undefined as unknown as () => ArrayReply<StreamDeletionReplyCode>,
} as const satisfies Command;
