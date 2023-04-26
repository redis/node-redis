// import { RedisCommandArgument, RedisCommandArguments } from '.';
// import { pushVariadicArgument } from './generic-transformers';

// export const FIRST_KEY_INDEX = 1;

// interface ZUnionOptions {
//     WEIGHTS?: Array<number>;
//     AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
// }

// export function transformArguments(
//     destination: RedisCommandArgument,
//     keys: Array<RedisCommandArgument> | RedisCommandArgument,
//     options?: ZUnionOptions
// ): RedisCommandArguments {
//     const args = pushVariadicArgument(['ZUNIONSTORE', destination], keys);

//     if (options?.WEIGHTS) {
//         args.push('WEIGHTS', ...options.WEIGHTS.map(weight => weight.toString()));
//     }

//     if (options?.AGGREGATE) {
//         args.push('AGGREGATE', options.AGGREGATE);
//     }

//     return args;
// }

// export declare function transformReply(): number;
