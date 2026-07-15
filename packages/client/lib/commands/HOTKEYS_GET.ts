import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { isPlainObject, mapLikeEntries, mapLikeValues } from './reply-utils';

/**
 * Hotkey entry with key name and metric value
 */
export interface HotkeyEntry {
  key: string;
  value: number;
}

/**
 * Slot range with start and end values
 */
export interface SlotRange {
  start: number;
  end: number;
}

/**
 * HOTKEYS GET response structure
 */
export interface HotkeysGetReply {
  trackingActive: number;
  sampleRatio: number;
  selectedSlots: Array<SlotRange>;
  /** Only present when sample-ratio > 1 AND selected-slots is not empty */
  sampledCommandsSelectedSlotsUs?: number;
  /** Only present when selected-slots is not empty */
  allCommandsSelectedSlotsUs?: number;
  allCommandsAllSlotsUs: number;
  /** Only present when sample-ratio > 1 AND selected-slots is not empty */
  netBytesSampledCommandsSelectedSlots?: number;
  /** Only present when selected-slots is not empty */
  netBytesAllCommandsSelectedSlots?: number;
  netBytesAllCommandsAllSlots: number;
  collectionStartTimeUnixMs: number;
  collectionDurationMs: number;
  totalCpuTimeSysMs: number;
  totalCpuTimeUserMs: number;
  totalNetBytes: number;
  byCpuTimeUs?: Array<HotkeyEntry>;
  byNetBytes?: Array<HotkeyEntry>;
}

function toSlotNumber(value: unknown): number {
  const slot = Number(value);
  if (!Number.isFinite(slot)) {
    throw new TypeError(
      `HOTKEYS GET: expected slot to be a finite number, got ${JSON.stringify(value)}`
    );
  }
  return slot;
}

/**
 * Parse the hotkeys array into HotkeyEntry objects
 */
function parseHotkeysList(arr: unknown): Array<HotkeyEntry> {
  return mapLikeEntries(arr).map(([key, value]) => ({
    key,
    value: Number(value)
  }));
}

/**
 * Parse slot ranges from the server response.
 * Single slots are represented as arrays with one element: [slot]
 * Slot ranges are represented as arrays with two elements: [start, end]
 */
function parseSlotRanges(arr: unknown): Array<SlotRange> {
  return mapLikeValues(arr).map(range => {
    let unwrapped: Array<unknown>;

    if (Array.isArray(range)) {
      unwrapped = range;
    } else if (range instanceof Map) {
      unwrapped = [...range.values()];
    } else if (isPlainObject(range)) {
      const start = range.start ?? range[0];
      const end = range.end ?? range[1] ?? start;
      unwrapped = [start, end];
    } else {
      const slot = toSlotNumber(range);
      return { start: slot, end: slot };
    }

    if (unwrapped.length === 1) {
      const slot = toSlotNumber(unwrapped[0]);
      return { start: slot, end: slot };
    }

    return {
      start: toSlotNumber(unwrapped[0]),
      end: toSlotNumber(unwrapped[1])
    };
  });
}

/**
 * Transform the raw reply into a structured object
 */
function transformHotkeysGetReply(reply: unknown | null): HotkeysGetReply | null {
  if (reply === null) return null;

  const result: Partial<HotkeysGetReply> = {};
  for (const [key, value] of mapLikeEntries(reply)) {

    switch (key) {
      case 'tracking-active':
        result.trackingActive = Number(value);
        break;
      case 'sample-ratio':
        result.sampleRatio = Number(value);
        break;
      case 'selected-slots':
        result.selectedSlots = parseSlotRanges(value);
        break;
      case 'sampled-commands-selected-slots-us':
        result.sampledCommandsSelectedSlotsUs = Number(value);
        break;
      case 'all-commands-selected-slots-us':
        result.allCommandsSelectedSlotsUs = Number(value);
        break;
      case 'all-commands-all-slots-us':
        result.allCommandsAllSlotsUs = Number(value);
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
      case 'total-cpu-time-sys-ms':
        result.totalCpuTimeSysMs = Number(value);
        break;
      case 'total-cpu-time-user-ms':
        result.totalCpuTimeUserMs = Number(value);
        break;
      case 'total-net-bytes':
        result.totalNetBytes = Number(value);
        break;
      case 'by-cpu-time-us':
        result.byCpuTimeUs = parseHotkeysList(value);
        break;
      case 'by-net-bytes':
        result.byNetBytes = parseHotkeysList(value);
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
 * - EMPTY -> returns null
 *
 * Note: this transform always returns a structured `HotkeysGetReply` DTO and
 * does not honor `typeMapping` (e.g. `RESP_TYPES.MAP: Map`/`Array`). The
 * server-side payload is treated as a fixed schema, not a generic map.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'GET');
  },
  transformReply: transformHotkeysGetReply
} as const satisfies Command;
