import { CommandParser } from '../client/parser';
import { ArrayReply, Command, UnwrapReply } from '../RESP/types';
import { CommandRawReply, CommandReply, transformCommandReply } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, commands: Array<string>) {
    parser.push('COMMAND', 'INFO', ...commands);
  },
  // TODO: This works, as we don't currently handle any of the items returned as a map
  transformReply(reply: UnwrapReply<ArrayReply<CommandRawReply>>): Array<CommandReply | null> {
    return reply.map(command => command ? transformCommandReply(command) : null);
  }
} as const satisfies Command;