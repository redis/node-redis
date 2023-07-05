// // export type InfoRawReply = [
// //     _: string,
// //     capacity: number,
// //     _: string,
// //     size: number,
// //     _: string,
// //     numberOfFilters: number,
// //     _: string,
// //     numberOfInsertedItems: number,
// //     _: string,
// //     expansionRate: number,
// // ];

// // export interface InfoReply {
// //     capacity: number;
// //     size: number;
// //     numberOfFilters: number;
// //     numberOfInsertedItems: number;
// //     expansionRate: number;
// // }

// // export function transformReply(reply: InfoRawReply): InfoReply {
// //     return {
// //         capacity: reply[1],
// //         size: reply[3],
// //         numberOfFilters: reply[5],
// //         numberOfInsertedItems: reply[7],
// //         expansionRate: reply[9]
// //     };
// // }

// import { RedisArgument, Command, TuplesToMapReply, BlobStringReply, NumberReply } from '@redis/client/dist/lib/RESP/types';
// import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

// export type BfInfoReply = TuplesToMapReply<[
//   [BlobStringReply<'Capacity'>, NumberReply],
//   [BlobStringReply<'Size'>, NumberReply],
//   [BlobStringReply<'Number of filters'>, NumberReply],
  

// ]>;

// export default {
//   FIRST_KEY_INDEX: 1,
//   IS_READ_ONLY: true,
//   transformArguments(key: RedisArgument) {
//     return ['BF.INFO', key];
//   },
//   transformReply: {
//     2: () => {

//     },
//     3: () => {

//     }
//   }
// } as const satisfies Command;
