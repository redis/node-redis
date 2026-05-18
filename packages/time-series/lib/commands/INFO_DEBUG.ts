import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { BlobStringReply, Command, NumberReply, SimpleStringReply, TypeMapping, ReplyUnion } from "@redis/client/dist/lib/RESP/types";
import { mapLikeToObject, mapLikeValues } from '@redis/client/dist/lib/commands/reply-utils';
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

function normalizeChunks(chunks: unknown): InfoDebugReply['chunks'] {
  return mapLikeValues(chunks).map(chunk => {
    if (Array.isArray(chunk)) {
      if (chunk.length >= 10 && chunk[0] === 'startTimestamp') {
        return {
          startTimestamp: chunk[1],
          endTimestamp: chunk[3],
          samples: chunk[5],
          size: chunk[7],
          bytesPerSample: chunk[9].toString()
        };
      }

      return {
        startTimestamp: chunk[0],
        endTimestamp: chunk[1],
        samples: chunk[2],
        size: chunk[3],
        bytesPerSample: chunk[4].toString()
      };
    }

    const object = mapLikeToObject(chunk);
    return {
      startTimestamp: object.startTimestamp ?? object.start_timestamp,
      endTimestamp: object.endTimestamp ?? object.end_timestamp,
      samples: object.samples,
      size: object.size,
      bytesPerSample: (object.bytesPerSample ?? object.bytes_per_sample as { toString(): string }).toString()
    };
  });
}

export default {
  IS_READ_ONLY: INFO.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: string) {
    INFO.parseCommand(parser, key);
    parser.push('DEBUG');
  },
  transformReply: {
    2: (reply: InfoDebugRawReply, _, typeMapping?: TypeMapping): InfoDebugReply => {
      const ret = INFO.transformReply[2](reply as unknown as InfoRawReply, _, typeMapping) as unknown as Record<string, unknown>;

      for (let i=0; i < reply.length; i += 2) {
        const key = (reply[i] as { toString(): string }).toString();

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

      return ret as unknown as InfoDebugReply;
    },
    3: (reply: ReplyUnion, preserve?: unknown, typeMapping?: TypeMapping): InfoDebugReply => {
      const ret = INFO.transformReply[3](reply, preserve, typeMapping) as InfoDebugReply;
      const mappedReply = mapLikeToObject(reply);

      ret.keySelfName = (mappedReply.keySelfName ?? mappedReply.key_self_name) as BlobStringReply;

      const chunks = mappedReply.Chunks ?? mappedReply.chunks;
      ret.chunks = normalizeChunks(chunks);

      return ret;
    }
  },
} as const satisfies Command;
