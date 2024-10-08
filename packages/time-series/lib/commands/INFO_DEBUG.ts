import { BlobStringReply, Command, NumberReply, SimpleStringReply, TypeMapping } from "@redis/client/dist/lib/RESP/types";
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
  'chunks',
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
  FIRST_KEY_INDEX: INFO.FIRST_KEY_INDEX,
  IS_READ_ONLY: INFO.IS_READ_ONLY,
  transformArguments(key: string) {
    const args = INFO.transformArguments(key);
    args.push('DEBUG');
		return args;
  },
  transformReply: {
    2: (rawReply: InfoDebugRawReply, _, typeMapping?: TypeMapping): InfoDebugReply => {
      const reply = INFO.transformReply[2](rawReply as unknown as InfoRawReply, _, typeMapping) as unknown as InfoDebugReply;
      // decide if > 7.4 or < 7.4
      const debugBaseIndex = reply.ignoreMaxTimeDiff === undefined ? 25 : 29;

      reply.keySelfName = rawReply[debugBaseIndex] as BlobStringReply;
      reply.chunks = (rawReply[debugBaseIndex+2] as chunkType).map(
        chunk => ({
          startTimestamp: chunk[1],
          endTimestamp: chunk[3],
          samples: chunk[5],
          size: chunk[7],
          bytesPerSample: chunk[9]
        })
      );

      return reply;
		},
    3: undefined as unknown as () => InfoDebugReply
  }
} as const satisfies Command;