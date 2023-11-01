import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(path: RedisArgument, moduleArguments?: Array<RedisArgument>) {
    const args = ['MODULE', 'LOAD', path];

    if (moduleArguments) {
      return args.concat(moduleArguments);
    }
    
    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
