import { CommandParser } from '@redis/client/lib/client/parser';
import { BlobStringReply, Command, NumberReply, SimpleStringReply, TypeMapping, ReplyUnion } from "@redis/client/lib/RESP/types";
import INFO, { InfoRawReply, InfoRawReplyTypes, InfoReply } from "./INFO";

type chunkType = Array<[
  'startTimestamp',
  NumberReply,
  'endTimestamp',
  NumberReply,
  'samples',
  NumberReply,
  'size',
  NumberReply,
  'bytesPerSample',
  SimpleStringReply
]>;

type InfoDebugRawReply = [
  ...InfoRawReply,
  'keySelfName',
  BlobStringReply,
  'Chunks',
  chunkType
];

export type InfoDebugRawReplyType = InfoRawReplyTypes | chunkType

export interface InfoDebugReply extends InfoReply {
  keySelfName: BlobStringReply,
  chunks: Array<{
    startTimestamp: NumberReply;
    endTimestamp: NumberReply;
    samples: NumberReply;
    size: NumberReply;
    bytesPerSample: SimpleStringReply;
  }>;
}

export default {
  IS_READ_ONLY: INFO.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: string) {
    INFO.parseCommand(parser, key);
    parser.push('DEBUG');
  },
  transformReply: {
    2: (reply: InfoDebugRawReply, _, typeMapping?: TypeMapping): InfoDebugReply => {
      const ret = INFO.transformReply[2](reply as unknown as InfoRawReply, _, typeMapping) as any;

      for (let i=0; i < reply.length; i += 2) {
        const key = (reply[i] as any).toString();

        switch (key) {
          case 'keySelfName': {
            ret[key] = reply[i+1];
            break;
          }
          case 'Chunks': {
            ret['chunks'] = (reply[i+1] as chunkType).map(
              chunk => ({
                startTimestamp: chunk[1],
                endTimestamp: chunk[3],
                samples: chunk[5],
                size: chunk[7],
                bytesPerSample: chunk[9]
              })
            );
            break;
          }
        }
      }

      return ret;
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;
