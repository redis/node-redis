import * as ADD from './ADD';
import * as CDF from './CDF';
import * as CREATE from './CREATE';
import * as INFO from './INFO';
import * as MAX from './MAX';
import * as MERGE from './MERGE';
import * as MERGESTORE from './MERGESTORE';
import * as MIN from './MIN';
import * as QUANTILE from './QUANTILE';
import * as RESET from './RESET';
import * as TRIMMED_MEAN from './TRIMMED_MEAN';

export default {
    ADD,
    add: ADD,
    CDF,
    cdf: CDF,
    CREATE,
    create: CREATE,
    INFO,
    info: INFO,
    MAX,
    max: MAX,
    MERGE,
    merge: MERGE,
    MERGESTORE,
    mergeStore: MERGESTORE,
    MIN,
    min: MIN,
    QUANTILE,
    quantile: QUANTILE,
    RESET,
    reset: RESET,
    TRIMMED_MEAN,
    trimmedMean: TRIMMED_MEAN
};

export type DoubleMinReply = `${'DBL_MIN' | number}`;

function transformDoubleMinRepy(reply: DoubleMinReply): number {
    return reply === 'DBL_MIN' ? 
}
