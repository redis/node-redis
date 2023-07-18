// import { transformRedisJsonArgument } from '.';

// export const FIRST_KEY_INDEX = 1;

// type AppendArguments = [key: string, append: string];

// type AppendWithPathArguments = [key: string, path: string, append: string];

// export function transformArguments(...[key, pathOrAppend, append]: AppendArguments | AppendWithPathArguments): Array<string> {
//     const args = ['JSON.STRAPPEND', key];

//     if (append !== undefined && append !== null) {
//         args.push(pathOrAppend, transformRedisJsonArgument(append));
//     } else {
//         args.push(transformRedisJsonArgument(pathOrAppend));
//     }

//     return args;
// }

// export declare function transformReply(): number | Array<number>;

import { SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments() {
    return ['JSON.STRAPPEND'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
