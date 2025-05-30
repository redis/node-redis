import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the WAIT command to synchronize with replicas
   *
   * @param parser - The command parser
   * @param numberOfReplicas - Number of replicas that must acknowledge the write
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The number of replicas that acknowledged the write
   * @see https://redis.io/commands/wait/
   */
  parseCommand(parser: CommandParser, numberOfReplicas: number, timeout: number) {
    parser.push('WAIT', numberOfReplicas.toString(), timeout.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
