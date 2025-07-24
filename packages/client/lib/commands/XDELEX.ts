import { CommandParser } from "../client/parser";
import { RedisArgument, ArrayReply, Command } from "../RESP/types";
import { RedisVariadicArgument } from "./generic-transformers";

/** XDELEX deletion policies */
export const XDelexPolicy = {
  /** Preserve references (default) */
  KEEPREF: "KEEPREF",
  /** Delete all references */
  DELREF: "DELREF",
  /** Only acknowledged entries */
  ACKED: "ACKED",
} as const;

/** XDELEX reply codes */
export const XDELEX_REPLY_CODES = {
  /** ID not found */
  NOT_FOUND: -1,
  /** Entry deleted */
  DELETED: 1,
  /** Dangling references */
  DANGLING_REFS: 2,
} as const;

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
    policy?: (typeof XDelexPolicy)[keyof typeof XDelexPolicy],
  ) {
    parser.push("XDELEX");
    parser.pushKey(key);

    if (policy) {
      parser.push(policy);
    }

    parser.push("IDS");
    parser.pushVariadicWithLength(id);
  },
  transformReply: undefined as unknown as () => ArrayReply<
    (typeof XDELEX_REPLY_CODES)[keyof typeof XDELEX_REPLY_CODES]
  >,
} as const satisfies Command;
