import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS_MULTIAGGR, { createTransformMRangeSelectedLabelsMultiArguments } from './MRANGE_SELECTED_LABELS_MULTIAGGR';

export default {
  NOT_KEYED_COMMAND: MRANGE_SELECTED_LABELS_MULTIAGGR.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_SELECTED_LABELS_MULTIAGGR.IS_READ_ONLY,
  parseCommand: createTransformMRangeSelectedLabelsMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_MULTIAGGR.transformReply,
} as const satisfies Command;
