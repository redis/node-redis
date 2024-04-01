import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export interface XReadGroupStream {
  key: ValkeyCommandArgument;
  id: ValkeyCommandArgument;
}

export interface XReadGroupOptions {
  COUNT?: number;
  BLOCK?: number;
  NOACK?: true;
}

export const FIRST_KEY_INDEX = (
  _group: ValkeyCommandArgument,
  _consumer: ValkeyCommandArgument,
  streams: Array<XReadGroupStream> | XReadGroupStream
): ValkeyCommandArgument => {
  return Array.isArray(streams) ? streams[0].key : streams.key;
};

export const IS_READ_ONLY = true;

export function transformArguments(
  group: ValkeyCommandArgument,
  consumer: ValkeyCommandArgument,
  streams: Array<XReadGroupStream> | XReadGroupStream,
  options?: XReadGroupOptions
): ValkeyCommandArguments {
  const args = ["XREADGROUP", "GROUP", group, consumer];

  if (options?.COUNT) {
    args.push("COUNT", options.COUNT.toString());
  }

  if (typeof options?.BLOCK === "number") {
    args.push("BLOCK", options.BLOCK.toString());
  }

  if (options?.NOACK) {
    args.push("NOACK");
  }

  args.push("STREAMS");

  const streamsArray = Array.isArray(streams) ? streams : [streams],
    argsLength = args.length;
  for (let i = 0; i < streamsArray.length; i++) {
    const stream = streamsArray[i];
    args[argsLength + i] = stream.key;
    args[argsLength + streamsArray.length + i] = stream.id;
  }

  return args;
}

export { transformStreamsMessagesReply as transformReply } from "./generic-transformers";
