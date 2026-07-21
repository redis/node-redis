import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesReply, NumberReply, BlobStringReply, UnwrapReply, Command } from '../RESP/types';
import { parseArGrepArguments, ArGrepArguments } from './ARGREP';

export type ArGrepWithValuesReply = Array<{
  index: NumberReply;
  value: BlobStringReply;
}>;

export default {
  parseCommand(parser: CommandParser, ...args: ArGrepArguments) {
    parser.push('ARGREP');
    parseArGrepArguments(parser, ...args);
    parser.push('WITHVALUES');
  },
  transformReply: (reply: ArrayReply<TuplesReply<[index: NumberReply, value: BlobStringReply]>>) => {
    const unwrapped = reply as unknown as UnwrapReply<typeof reply>;
    return unwrapped.map(pair => {
      const [index, value] = pair as unknown as UnwrapReply<typeof pair>;
      return { index, value };
    }) satisfies ArGrepWithValuesReply;
  }
} as const satisfies Command;
