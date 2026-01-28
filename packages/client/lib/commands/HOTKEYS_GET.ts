import { CommandParser } from '../client/parser';
import { Command, ReplyUnion, UnwrapReply, ArrayReply, BlobStringReply, NumberReply } from '../RESP/types';

/**
 * Hotkey entry with key name and metric value
 */
export interface HotkeyEntry {
  key: string;
  value: number;
}

/**
 * HOTKEYS GET response structure
 */
export interface HotkeysGetReply {
  trackingActive: number;
  sampleRatio: number;
  selectedSlots: Array<number>;
  sampledCommandSelectedSlotsMs?: number;
  allCommandsSelectedSlotsMs?: number;
  allCommandsAllSlotsMs: number;
  netBytesSampledCommandsSelectedSlots?: number;
  netBytesAllCommandsSelectedSlots?: number;
  netBytesAllCommandsAllSlots: number;
  collectionStartTimeUnixMs: number;
  collectionDurationMs: number;
  usedCpuSysMs: number;
  usedCpuUserMs: number;
  totalNetBytes: number;
  byCpuTime: Array<HotkeyEntry>;
  byNetBytes: Array<HotkeyEntry>;
}

type HotkeysGetRawReply = ArrayReply<BlobStringReply | NumberReply | ArrayReply<BlobStringReply | NumberReply>>;

/**
 * Parse the hotkeys array into HotkeyEntry objects
 */
function parseHotkeysList(arr: Array<BlobStringReply | NumberReply>): Array<HotkeyEntry> {
  const result: Array<HotkeyEntry> = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push({
      key: arr[i].toString(),
      value: Number(arr[i + 1])
    });
  }
  return result;
}

/**
 * Transform the raw reply into a structured object
 */
function transformHotkeysGetReply(reply: UnwrapReply<HotkeysGetRawReply>): HotkeysGetReply {
  const result: Partial<HotkeysGetReply> = {};

  for (let i = 0; i < reply.length; i += 2) {
    const key = reply[i].toString();
    const value = reply[i + 1];

    switch (key) {
      case 'tracking-active':
        result.trackingActive = Number(value);
        break;
      case 'sample-ratio':
        result.sampleRatio = Number(value);
        break;
      case 'selected-slots':
        result.selectedSlots = (value as unknown as Array<NumberReply>).map(Number);
        break;
      case 'sampled-command-selected-slots-ms':
        result.sampledCommandSelectedSlotsMs = Number(value);
        break;
      case 'all-commands-selected-slots-ms':
        result.allCommandsSelectedSlotsMs = Number(value);
        break;
      case 'all-commands-all-slots-ms':
        result.allCommandsAllSlotsMs = Number(value);
        break;
      case 'net-bytes-sampled-commands-selected-slots':
        result.netBytesSampledCommandsSelectedSlots = Number(value);
        break;
      case 'net-bytes-all-commands-selected-slots':
        result.netBytesAllCommandsSelectedSlots = Number(value);
        break;
      case 'net-bytes-all-commands-all-slots':
        result.netBytesAllCommandsAllSlots = Number(value);
        break;
      case 'collection-start-time-unix-ms':
        result.collectionStartTimeUnixMs = Number(value);
        break;
      case 'collection-duration-ms':
        result.collectionDurationMs = Number(value);
        break;
      case 'used-cpu-sys-ms':
        result.usedCpuSysMs = Number(value);
        break;
      case 'used-cpu-user-ms':
        result.usedCpuUserMs = Number(value);
        break;
      case 'total-net-bytes':
        result.totalNetBytes = Number(value);
        break;
      case 'by-cpu-time':
        result.byCpuTime = parseHotkeysList(value as unknown as Array<BlobStringReply | NumberReply>);
        break;
      case 'by-net-bytes':
        result.byNetBytes = parseHotkeysList(value as unknown as Array<BlobStringReply | NumberReply>);
        break;
    }
  }

  return result as HotkeysGetReply;
}

/**
 * HOTKEYS GET command - returns hotkeys tracking data
 * 
 * State transitions:
 * - ACTIVE -> returns data (does not stop)
 * - STOPPED -> returns data
 * - EMPTY -> returns nil
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the top K hotkeys by CPU time and network bytes.
   * Returns nil if no tracking has been started or tracking was reset.
   * @param parser - The Redis command parser
   * @see https://redis.io/commands/hotkeys-get/
   */
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'GET');
  },
  transformReply: {
    2: (reply: UnwrapReply<HotkeysGetRawReply> | null): HotkeysGetReply | null => {
      if (reply === null) return null;
      return transformHotkeysGetReply(reply);
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

