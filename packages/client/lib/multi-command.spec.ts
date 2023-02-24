import { strict as assert } from 'assert';
import RedisMultiCommand from './multi-command';
import { WatchError } from './errors';
import { SQUARE_SCRIPT } from './client/index.spec';

describe('Multi Command', () => {
    it('generateChainId', () => {
        assert.equal(
            typeof RedisMultiCommand.generateChainId(),
            'symbol'
        );
    });

    it('addCommand', () => {
        const multi = new RedisMultiCommand();
        multi.addCommand(['PING']);

        assert.deepEqual(
            multi.queue[0].args,
            ['PING']
        );
    });

    it('addScript', () => {
        const multi = new RedisMultiCommand();

        multi.addScript(SQUARE_SCRIPT, ['1']);
        assert.equal(
            multi.scriptsInUse.has(SQUARE_SCRIPT.SHA1),
            true
        );
        assert.deepEqual(
            multi.queue[0].args,
            ['EVAL', SQUARE_SCRIPT.SCRIPT, '0', '1']
        );

        multi.addScript(SQUARE_SCRIPT, ['2']);
        assert.equal(
            multi.scriptsInUse.has(SQUARE_SCRIPT.SHA1),
            true
        );
        assert.deepEqual(
            multi.queue[1].args,
            ['EVALSHA', SQUARE_SCRIPT.SHA1, '0', '2']
        );
    });

    describe('exec', () => {
        it('without commands', () => {
            assert.deepEqual(
                new RedisMultiCommand().queue,
                []
            );
        });

        it('with commands', () => {
            const multi = new RedisMultiCommand();
            multi.addCommand(['PING']);

            assert.deepEqual(
                multi.queue,
                [{
                    args: ['PING'],
                    transformReply: undefined
                }]
            );
        });
    });

    describe('handleExecReplies', () => {
        it('WatchError', () => {
            assert.throws(
                () => new RedisMultiCommand().handleExecReplies([null]),
                WatchError
            );
        });

        it('with replies', () => {
            const multi = new RedisMultiCommand();
            multi.addCommand(['PING']);
            assert.deepEqual(
                multi.handleExecReplies(['OK', 'QUEUED', ['PONG']]),
                ['PONG']
            );
        });
    });

    it('transformReplies', () => {
        const multi = new RedisMultiCommand();
        multi.addCommand(['PING'], (reply: string) => reply.substring(0, 2));
        assert.deepEqual(
            multi.transformReplies(['PONG']),
            ['PO']
        );
    });
});
