import COMMON_COMMANDS from './index';
import * as MOVE from './MOVE';

export default {
    ...COMMON_COMMANDS,
    MOVE,
    move: MOVE
};
