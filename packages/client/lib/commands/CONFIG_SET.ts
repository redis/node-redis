import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';

type SingleParameter = [parameter: RedisArgument, value: RedisArgument];

type MultipleParameters = [config: Record<string, RedisArgument>];

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
  ) {
    parser.push('CONFIG', 'SET');
  
    if (typeof parameterOrConfig === 'string' || parameterOrConfig instanceof Buffer) {
      parser.push(parameterOrConfig, value!);
    } else {
      for (const [key, value] of Object.entries(parameterOrConfig)) {
        parser.push(key, value);
      }
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
