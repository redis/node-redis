import { CommandParser } from '../client/parser';
import { ArrayReply, Command, UnwrapReply } from '../RESP/types';
import { CommandRawReply, CommandReply, transformCommandReply } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns an array with details about all Redis commands
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('COMMAND');
  },
  // TODO: This works, as we don't currently handle any of the items returned as a map
  transformReply(reply: UnwrapReply<ArrayReply<CommandRawReply>>): Array<CommandReply> {
    return reply.map(transformCommandReply);
  }
} as const satisfies Command;