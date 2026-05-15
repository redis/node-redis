import { CommandParser } from '../client/parser';
import { ArrayReply, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Blocks the current client until all previous write commands have been
   * acknowledged by the local Append-Only File and/or the specified number
   * of replicas, or until the given timeout (in milliseconds) is reached.
   *
   * @param parser - The command parser
   * @param numLocal - Number of local AOF fsyncs to wait for (`0` or `1`)
   * @param numReplicas - Number of replica AOF fsyncs to wait for
   * @param timeout - Maximum time to wait in milliseconds (`0` for no timeout)
   * @see https://redis.io/commands/waitaof/
   */
  parseCommand(parser: CommandParser, numLocal: number, numReplicas: number, timeout: number) {
    parser.push('WAITAOF', numLocal.toString(), numReplicas.toString(), timeout.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
