import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export const CLIENT_UNBLOCK_MODES = {
  TIMEOUT: 'TIMEOUT',
  ERROR: 'ERROR'
} as const;

export type ClientUnblockMode = typeof CLIENT_UNBLOCK_MODES[keyof typeof CLIENT_UNBLOCK_MODES];

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, clientId: number | `${number}`, mode?: ClientUnblockMode) {
    parser.push(
      'CLIENT',
      'UNBLOCK',
      typeof clientId === 'number' ? clientId.toString() : clientId
    );

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
