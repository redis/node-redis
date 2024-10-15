import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export type SentinelSetOptions = Array<{
  option: RedisArgument;
  value: RedisArgument;
}>;

export default {
  transformArguments(dbname: RedisArgument, options: SentinelSetOptions) {
    const args = ['SENTINEL', 'SET', dbname];

    for (const option of options) {
      args.push(option.option, option.value);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
