import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

type SingleParameter = [parameter: RedisArgument, value: RedisArgument];

type MultipleParameters = [config: Record<string, RedisArgument>];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
  ) {
    parser.pushVariadic(['CONFIG', 'SET']);
  
    if (typeof parameterOrConfig === 'string' || parameterOrConfig instanceof Buffer) {
      parser.pushVariadic([parameterOrConfig, value!]);
    } else {
      for (const [key, value] of Object.entries(parameterOrConfig)) {
        parser.pushVariadic([key, value]);
      }
    }
  },
  transformArguments(
    ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
  ) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
