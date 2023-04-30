// import { NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, Resp2Reply, Command, RedisArgument } from '../RESP/types';
// import { pushVariadicArgument, RedisVariadicArgument, SortedSetSide } from './generic-transformers';

// export interface ZMPopOptions {
//   COUNT?: number;
// }

// export type ZMPopRawReply = NullReply | TuplesReply<[
//   key: BlobStringReply,
//   elements: ArrayReply<TuplesReply<[
//     member: BlobStringReply,
//     score: DoubleReply
//   ]>>
// ]>;

// export function pushZMPopArguments(
//   args: Array<RedisArgument>,
//   keys: RedisVariadicArgument,
//   side: SortedSetSide,
//   options: ZMPopOptions
// )

// export default {
//   FIRST_KEY_INDEX: 2,
//   IS_READ_ONLY: false,
//   transformArguments(
//     keys: RedisVariadicArgument,
//     side: SortedSetSide,
//     options?: ZMPopOptions
//   ) {
//     const args = pushVariadicArgument(['ZMPOP'], keys);

//     args.push(side);

//     if (options?.COUNT) {
//       args.push('COUNT', options.COUNT.toString());
//     }

//     return args;
//   },
//   transformReply: {
//     2: (reply: Resp2Reply<ZMPopRawReply>) => {
//       return reply === null ? null : {
//         key: reply[0],
//         elements: reply[1].map(([member, score]) => ({
//           member,
//           score: Number(score)
//         }))
//       };
//     },
//     3: (reply: ZMPopRawReply) => {
//       return reply === null ? null : {
//         key: reply[0],
//         elements: reply[1].map(([member, score]) => ({
//           member,
//           score
//         }))
//       };
//     },
//   }
// } as const satisfies Command;
