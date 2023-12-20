import { SimpleStringReply, Command, RedisArgument } from "../../RESP/types";

export default {
  transformArguments(dbname: RedisArgument, options: Array<{option: RedisArgument, value: RedisArgument}>) {
    if (options.length == 0) {
      throw new Error("must provide options")
    }

    const args: Array<RedisArgument> = ['SENTINEL', 'SET', dbname]

    for (const option of options) {
        args.push(option.option, option.value);
    }

    return args;
  },
  
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;