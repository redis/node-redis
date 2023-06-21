import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';

type SingleParameter = [parameter: RedisArgument, value: RedisArgument];

type MultipleParameters = [config: Record<string, RedisArgument>];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(
    ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
  ) {
    const args: Array<RedisArgument> = ['CONFIG', 'SET'];
  
    if (typeof parameterOrConfig === 'string' || parameterOrConfig instanceof Buffer) {
      args.push(parameterOrConfig, value!);
    } else {
      for (const [key, value] of Object.entries(parameterOrConfig)) {
        args.push(key, value);
      }
    }
  
    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
